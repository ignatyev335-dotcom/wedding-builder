import { type UserRole } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import {
  adminCookieName,
  readAdminToken,
} from "@/lib/auth/admin-session";
import {
  authCookieName,
  hasValidSessionToken,
} from "@/lib/auth/session";

const protectedPrefixes = [
  "/account",
  "/builder",
  "/constructor",
  "/dashboard",
];

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authJsToken = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const authJsRole = authJsToken?.role as UserRole | undefined;

  const hasAdminSession = Boolean(
    readAdminToken(request.cookies.get(adminCookieName)?.value),
  );
  const hasLegacySession = hasValidSessionToken(
    request.cookies.get(authCookieName)?.value,
  );
  const hasAuthJsSession = Boolean(authJsToken?.sub);
  const isAuthenticated =
    hasAdminSession || hasLegacySession || hasAuthJsSession;
  const isAdmin = hasAdminSession || authJsRole === "ADMIN";

  if (isAdminPath(pathname)) {
    if (isAdmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authJsRole === "ADMIN" && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/builder/:path*",
    "/constructor/:path*",
    "/dashboard/:path*",
  ],
};
