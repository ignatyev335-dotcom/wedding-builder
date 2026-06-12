import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

function isAdminProtectedPath(pathname: string) {
  return pathname.startsWith("/admin/") && pathname !== "/admin";
}

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (isAdminProtectedPath(pathname)) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (isDashboardPath(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
