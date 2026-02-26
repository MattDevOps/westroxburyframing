import { NextResponse } from "next/server";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { subscribeToMailchimp } from "@/lib/mailchimp";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const result = await subscribeToMailchimp(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Failed to subscribe" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
