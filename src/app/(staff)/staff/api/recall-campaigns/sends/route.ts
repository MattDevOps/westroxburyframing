import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/recall-campaigns/sends?status=pending_review&campaignId=...
 * List sends, optionally filtered.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending_review";
  const campaignId = searchParams.get("campaignId");

  const where: Record<string, unknown> = { status };
  if (campaignId) where.campaignId = campaignId;

  const sends = await prisma.recallCampaignSend.findMany({
    where,
    orderBy: { draftedAt: "desc" },
    include: {
      campaign: { select: { id: true, name: true, slug: true } },
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return NextResponse.json({ sends });
}
