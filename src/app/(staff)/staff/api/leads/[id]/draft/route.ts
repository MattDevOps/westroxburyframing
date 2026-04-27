import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /staff/api/leads/[id]/draft
 *
 * Discards the pending draft on a lead without sending. Clears all draft
 * fields. Returns 404 if the lead doesn't exist or has no draft.
 */
export async function DELETE(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, draftCreatedAt: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.draftCreatedAt) {
    return NextResponse.json({ error: "No draft to discard" }, { status: 404 });
  }

  await prisma.lead.update({
    where: { id },
    data: {
      draftSubject: null,
      draftBody: null,
      draftMode: null,
      draftSource: null,
      draftCreatedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}

/**
 * PATCH /staff/api/leads/[id]/draft
 *
 * Updates the draft subject/body in place (e.g. while staff is editing on the
 * review page and wants to save without sending yet). Both fields optional.
 */
export async function PATCH(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let payload: { subject?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, draftCreatedAt: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.draftCreatedAt) {
    return NextResponse.json({ error: "No draft to update" }, { status: 404 });
  }

  const updates: { draftSubject?: string; draftBody?: string } = {};
  if (typeof payload.subject === "string") updates.draftSubject = payload.subject;
  if (typeof payload.body === "string") updates.draftBody = payload.body;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.lead.update({ where: { id }, data: updates });
  return NextResponse.json({ ok: true });
}
