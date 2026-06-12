import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "vowly-session";
const ADMIN_COOKIE_NAME = "vowly-admin-session";

const PROTECTED_PREFIXES = [
  "/account",
  "/builder",
  "/constructor",
  "/dashboard",
];

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const hasLegacySession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const hasAdminSession = Boolean(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  const isAuthenticated = Boolean(token?.sub) || hasLegacySession || hasAdminSession;
  const isAdmin = token?.role === "ADMIN" || hasAdminSession;

  if (isAdminPath(pathname)) {
    if (isAdmin) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token?.role === "ADMIN" && pathname === "/dashboard") {
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
