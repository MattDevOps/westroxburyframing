import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  // Determine base URL for redirect
  const url = new URL("/staff/login", req.url);

  const res = NextResponse.redirect(url, 303); // 303 See Other → GET redirect
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
