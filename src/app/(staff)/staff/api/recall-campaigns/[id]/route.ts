import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.recallCampaign.findUnique({
    where: { id },
    include: {
      sends: {
        orderBy: { draftedAt: "desc" },
        take: 100,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
  if (!campaign)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ campaign });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  const stringFields = [
    "slug",
    "name",
    "description",
    "subject",
    "bodyHtml",
    "bodyText",
  ];
  for (const k of stringFields) {
    if (k in body) data[k] = body[k];
  }
  const numberFields = [
    "startMonth",
    "startDay",
    "endMonth",
    "endDay",
    "perRunCap",
  ];
  for (const k of numberFields) {
    if (k in body && typeof body[k] === "number") data[k] = body[k];
  }
  if ("enabled" in body) data.enabled = !!body.enabled;
  if ("segmentRule" in body) data.segmentRule = body.segmentRule;

  const updated = await prisma.recallCampaign.update({
    where: { id },
    data,
  });
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  await prisma.recallCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
