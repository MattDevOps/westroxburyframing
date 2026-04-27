import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/marketing/usage-stats
 *
 * Returns rough cost/volume estimates for the current calendar month:
 *   - aiDraftsCount       — outbound LeadEmail rows with outboundKind=ai_drafted/auto_followup
 *                           PLUS leads currently in draft (drafted but not yet sent or discarded)
 *   - classificationsCount — inbound LeadEmail rows with classification set
 *   - postmarkOutbound    — count from Postmark Stats API for the current month
 *   - postmarkInbound     — same, inbound side
 *   - estimatedAnthropicSpendUsd — back-of-envelope: drafts × $0.07 + classifications × $0.005
 *
 * Caveats:
 *   - Anthropic spend is ESTIMATED from per-call averages — for the real number,
 *     the response includes a link to console.anthropic.com.
 *   - Postmark counts come from /stats/outbound and /stats/inbound. Free tier
 *     keys can call these endpoints fine.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Per-call cost averages (USD). Update if model selection changes.
  const COST_PER_DRAFT_USD = 0.01; // Haiku 4.5, ~3K in / ~1.5K out
  const COST_PER_CLASSIFICATION_USD = 0.005; // Haiku 4.5, ~1.5K in / ~0.2K out

  const [aiDraftsSent, draftsPending, classifications] = await Promise.all([
    prisma.leadEmail.count({
      where: {
        direction: "outbound",
        createdAt: { gte: monthStart },
        outboundKind: { in: ["ai_drafted", "auto_followup"] },
      },
    }),
    // Leads currently sitting in the draft queue (already cost an AI call, not yet sent or discarded)
    prisma.lead.count({
      where: {
        draftCreatedAt: { gte: monthStart },
      },
    }),
    prisma.leadEmail.count({
      where: {
        direction: "inbound",
        createdAt: { gte: monthStart },
        classification: { not: null },
      },
    }),
  ]);

  const aiDraftsCount = aiDraftsSent + draftsPending;
  const estimatedAnthropicSpendUsd =
    aiDraftsCount * COST_PER_DRAFT_USD + classifications * COST_PER_CLASSIFICATION_USD;

  // Postmark monthly counts — best-effort, returns nulls if key missing or API errors
  const postmarkStats = await fetchPostmarkMonthly(monthStart);

  return NextResponse.json({
    monthStartIso: monthStart.toISOString(),
    aiDraftsCount,
    aiDraftsSent,
    draftsPending,
    classificationsCount: classifications,
    estimatedAnthropicSpendUsd: Math.round(estimatedAnthropicSpendUsd * 100) / 100,
    costAssumptions: {
      perDraftUsd: COST_PER_DRAFT_USD,
      perClassificationUsd: COST_PER_CLASSIFICATION_USD,
      note: "Estimates use Haiku 4.5 for both drafting and classification. Real Anthropic spend at console.anthropic.com → Usage.",
    },
    postmarkOutbound: postmarkStats.outbound,
    postmarkInbound: postmarkStats.inbound,
    postmarkAvailable: postmarkStats.available,
  });
}

/**
 * Fetch Postmark monthly counts via the Stats API.
 * Returns nulls if the env var isn't set or the API errors.
 */
async function fetchPostmarkMonthly(
  monthStart: Date
): Promise<{ outbound: number | null; inbound: number | null; available: boolean }> {
  const rawToken =
    process.env.EMAIL_PROVIDER_API_KEY || process.env.POSTMARK_SERVER_API_TOKEN;
  if (!rawToken) {
    return { outbound: null, inbound: null, available: false };
  }
  // Capture the narrowed value as a const string so the closure below sees it
  // typed as `string` and not `string | undefined`.
  const token: string = rawToken;

  const fromDate = monthStart.toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  async function fetchCount(direction: "outbound" | "inbound"): Promise<number | null> {
    try {
      const res = await fetch(
        `https://api.postmarkapp.com/stats/${direction}?fromdate=${fromDate}&todate=${toDate}`,
        {
          headers: {
            Accept: "application/json",
            "X-Postmark-Server-Token": token,
          },
          // Avoid blocking the dashboard on a slow Postmark response
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) return null;
      const data: { Sent?: number; InboundCount?: number } = await res.json();
      // Outbound stats key is `Sent`; inbound stats key is `InboundCount`.
      if (direction === "outbound") {
        return typeof data.Sent === "number" ? data.Sent : null;
      }
      return typeof data.InboundCount === "number" ? data.InboundCount : null;
    } catch (e) {
      console.warn(`Postmark ${direction} stats fetch failed:`, e);
      return null;
    }
  }

  const [outbound, inbound] = await Promise.all([fetchCount("outbound"), fetchCount("inbound")]);
  return { outbound, inbound, available: true };
}
