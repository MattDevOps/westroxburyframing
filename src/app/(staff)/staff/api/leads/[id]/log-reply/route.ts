import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /staff/api/leads/[id]/log-reply
 * Body: {
 *   replyText: string,
 *   classification?: "positive" | "negative" | "neutral" | "needs_followup",
 *   subject?: string  // optional — if you have the subject of their reply
 * }
 *
 * Manually log a reply we received from this lead. Creates a LeadEmail record
 * (direction=inbound) AND updates the Lead's legacy reply fields for back-compat.
 */
export async function POST(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let payload: { replyText?: string; classification?: string; subject?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const replyText = (payload.replyText || "").trim();
  if (!replyText) return NextResponse.json({ error: "replyText is required" }, { status: 400 });

  const classification = payload.classification?.trim() || "neutral";
  const subject = payload.subject?.trim() || "(reply, manually logged)";

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Map classification → status
  const statusMap: Record<string, string> = {
    positive: "replied_positive",
    negative: "replied_negative",
    neutral: "replied_positive",
    needs_followup: "replied_positive",
  };
  const newStatus = (statusMap[classification] || "replied_positive") as
    | "replied_positive"
    | "replied_negative";

  const [, updated] = await prisma.$transaction([
    prisma.leadEmail.create({
      data: {
        leadId: lead.id,
        direction: "inbound",
        subject,
        body: replyText,
        fromAddr: lead.email,
        classification,
      },
    }),
    prisma.lead.update({
      where: { id },
      data: {
        replyText,
        replyClassification: classification,
        repliedAt: new Date(),
        status: newStatus,
        // Reply received → cancel any pending auto-followup
        autoFollowupAt: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, lead: updated });
}
