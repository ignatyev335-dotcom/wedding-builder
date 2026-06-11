import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/account",
  "/admin/dashboard",
  "/builder",
  "/constructor",
  "/dashboard",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasLegacySession = Boolean(request.cookies.get("vowly-session")?.value);
  const hasAuthJsSession = request.cookies
    .getAll()
    .some(
      ({ name, value }) =>
        Boolean(value) &&
        (name.includes("authjs.session-token") ||
          name.includes("next-auth.session-token")),
    );

  if (hasLegacySession || hasAuthJsSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/dashboard/:path*",
    "/builder/:path*",
    "/constructor/:path*",
    "/dashboard/:path*",
  ],
};
