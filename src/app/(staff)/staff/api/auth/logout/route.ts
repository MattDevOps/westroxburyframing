import { NextResponse } from "next/server";
import { clearStaffCookie } from "@/lib/auth";

export async function POST() {
  clearStaffCookie();
  return NextResponse.json({ ok: true });
}
