import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendRecallCampaignEmail } from "@/lib/email";
import { renderTemplate, templateVarsForCustomer } from "@/lib/recall";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/recall-campaigns/[id]/test-send
 * Sends the rendered template to the logged-in user's own email so they can
 * preview deliverability + render before enabling the campaign. Does NOT
 * create a RecallCampaignSend (no DB side-effect on customers).
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.recallCampaign.findUnique({ where: { id } });
  if (!campaign)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email)
    return NextResponse.json(
      { error: "Logged-in user has no email" },
      { status: 400 },
    );

  const vars = templateVarsForCustomer({
    firstName: user.name || "Friend",
    lastName: "",
  });
  const subject = `[TEST] ${renderTemplate(campaign.subject, vars)}`;
  const html = renderTemplate(campaign.bodyHtml, vars);
  const text = campaign.bodyText
    ? renderTemplate(campaign.bodyText, vars)
    : null;

  const result = await sendRecallCampaignEmail({
    to: user.email,
    subject,
    bodyHtml: html,
    bodyText: text,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Send failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, sentTo: user.email });
}
