import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: store as web_lead order + notify staff via email
  console.log("QUOTE REQUEST", body);
  return NextResponse.json({ ok: true, notify: env.STAFF_NOTIFICATIONS_EMAIL });
}
