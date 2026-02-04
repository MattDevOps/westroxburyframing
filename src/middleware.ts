import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow staff auth + all staff API routes without redirect loops
  if (pathname.startsWith("/staff/api")) {
    return NextResponse.next();
  }

  // Protect staff pages (but allow the login page)
  if (pathname.startsWith("/staff") && pathname !== "/staff/login") {
    const cookie = req.cookies.get("wrx_staff")?.value;
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/staff/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
