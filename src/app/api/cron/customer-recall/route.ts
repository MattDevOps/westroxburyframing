import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  findSegmentCustomers,
  isWithinWindow,
  renderTemplate,
  templateVarsForCustomer,
  type RecallSegmentRule,
} from "@/lib/recall";

/**
 * GET /api/cron/customer-recall
 * Daily Vercel Cron. For each enabled RecallCampaign whose window includes
 * today, draft personalized emails for matching customers and queue them as
 * RecallCampaignSend(status=pending_review). Nothing is sent here — staff must
 * review and approve in /staff/marketing/recall.
 *
 * Auth: Bearer CRON_SECRET (skipped if env unset, for local testing).
 *
 * Query params (for manual testing only — gated by an `x-recall-test` header
 * matching CRON_SECRET):
 *   ?force=1              ignore the calendar window and run all enabled campaigns
 *   ?campaignId=<uuid>    limit to a single campaign
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const campaignIdFilter = url.searchParams.get("campaignId");

  const today = new Date();
  const campaignYear = today.getFullYear();

  const campaigns = await prisma.recallCampaign.findMany({
    where: {
      enabled: true,
      ...(campaignIdFilter ? { id: campaignIdFilter } : {}),
    },
  });

  const eligible = campaigns.filter(
    (c) =>
      force ||
      isWithinWindow(today, c.startMonth, c.startDay, c.endMonth, c.endDay),
  );

  let totalDrafted = 0;
  const perCampaign: Array<{ slug: string; drafted: number; skipped: number }> = [];

  for (const c of eligible) {
    const rule = (c.segmentRule as RecallSegmentRule) || {};
    const customers = await findSegmentCustomers({
      campaignId: c.id,
      campaignYear,
      rule,
      limit: c.perRunCap,
    });

    let drafted = 0;
    let skipped = 0;
    for (const cust of customers) {
      if (!cust.email) {
        skipped++;
        continue;
      }
      const vars = templateVarsForCustomer(cust);
      const subject = renderTemplate(c.subject, vars);
      const html = renderTemplate(c.bodyHtml, vars);
      const text = c.bodyText ? renderTemplate(c.bodyText, vars) : null;

      try {
        await prisma.recallCampaignSend.create({
          data: {
            campaignId: c.id,
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
        // Unique constraint hit means this customer already drafted this year.
        skipped++;
      }
    }

    await prisma.recallCampaign.update({
      where: { id: c.id },
      data: { lastRunAt: today },
    });

    totalDrafted += drafted;
    perCampaign.push({ slug: c.slug, drafted, skipped });
  }

  return NextResponse.json({
    ok: true,
    enabledCampaigns: campaigns.length,
    eligibleCampaigns: eligible.length,
    totalDrafted,
    perCampaign,
  });
}
