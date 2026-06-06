import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow staff API routes to run without redirect loops
  if (pathname.startsWith("/staff/api")) {
    return NextResponse.next();
  }

  // Protect staff pages (but allow the login and password-reset pages)
  const publicStaffPages = ["/staff/login", "/staff/forgot-password", "/staff/reset-password"];
  if (pathname.startsWith("/staff") && !publicStaffPages.includes(pathname)) {
    const cookie = request.cookies.get("wrx_staff")?.value;
    if (!cookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/staff/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
