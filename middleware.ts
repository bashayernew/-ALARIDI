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

  // Branch-sales staff only get Orders and menu availability.
  const role = request.cookies.get("al_aridi_admin_role")?.value;
  if (role === "BRANCH_SALES") {
    const allowed =
      pathname === "/admin" || pathname.startsWith("/admin/availability");
    if (!allowed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
