import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

export const config = { matcher: ["/staff/:path*"] };
