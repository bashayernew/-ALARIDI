import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "al_aridi_admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  const adminCookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const hasAdminCookie =
    adminCookie === "1" || (adminCookie?.startsWith("u:") ?? false);
  if (!hasAdminCookie) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
