import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.recallCampaign.findMany({
    orderBy: [{ enabled: "desc" }, { startMonth: "asc" }, { startDay: "asc" }],
    include: {
      _count: { select: { sends: true } },
    },
  });

  // Per-campaign pending count
  const pending = await prisma.recallCampaignSend.groupBy({
    by: ["campaignId"],
    where: { status: "pending_review" },
    _count: { _all: true },
  });
  const pendingByCampaign: Record<string, number> = {};
  for (const p of pending) pendingByCampaign[p.campaignId] = p._count._all;

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      pendingCount: pendingByCampaign[c.id] || 0,
    })),
  });
}

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const required = ["slug", "name", "subject", "bodyHtml"];
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string") {
      return NextResponse.json(
        { error: `Missing field: ${k}` },
        { status: 400 },
      );
    }
  }
  const months = ["startMonth", "endMonth"];
  const days = ["startDay", "endDay"];
  for (const k of [...months, ...days]) {
    if (typeof body[k] !== "number") {
      return NextResponse.json(
        { error: `Missing/invalid field: ${k}` },
        { status: 400 },
      );
    }
  }

  const created = await prisma.recallCampaign.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description || null,
      startMonth: body.startMonth,
      startDay: body.startDay,
      endMonth: body.endMonth,
      endDay: body.endDay,
      segmentRule: body.segmentRule || {},
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText || null,
      enabled: !!body.enabled,
      perRunCap: typeof body.perRunCap === "number" ? body.perRunCap : 50,
    },
  });

  return NextResponse.json({ campaign: created });
}
