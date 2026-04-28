import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import {
  findSegmentCustomers,
  renderTemplate,
  templateVarsForCustomer,
  type RecallSegmentRule,
} from "@/lib/recall";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/recall-campaigns/[id]/run-now
 * Manually trigger drafting for one campaign, ignoring the calendar window.
 * Useful for testing in development and for forcing a run if the cron didn't
 * pick the campaign up.
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.recallCampaign.findUnique({ where: { id } });
  if (!campaign)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date();
  const campaignYear = today.getFullYear();
  const rule = (campaign.segmentRule as RecallSegmentRule) || {};

  const customers = await findSegmentCustomers({
    campaignId: campaign.id,
    campaignYear,
    rule,
    limit: campaign.perRunCap,
  });

  let drafted = 0;
  let skipped = 0;
  for (const cust of customers) {
    if (!cust.email) {
      skipped++;
      continue;
    }
    const vars = templateVarsForCustomer(cust);
    const subject = renderTemplate(campaign.subject, vars);
    const html = renderTemplate(campaign.bodyHtml, vars);
    const text = campaign.bodyText
      ? renderTemplate(campaign.bodyText, vars)
      : null;
    try {
      await prisma.recallCampaignSend.create({
        data: {
          campaignId: campaign.id,
          customerId: cust.id,
          campaignYear,
          status: "pending_review",
          renderedSubject: subject,
          renderedBodyHtml: html,
          renderedBodyText: text,
        },
      });
      drafted++;
    } catch {
      skipped++;
    }
  }

  await prisma.recallCampaign.update({
    where: { id: campaign.id },
    data: { lastRunAt: today },
  });

  return NextResponse.json({ ok: true, drafted, skipped });
}
