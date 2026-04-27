import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendOutreachEmail } from "@/lib/email";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /staff/api/leads/[id]/send-email
 * Body: {
 *   subject: string,
 *   body: string,
 *   fromOverride?: string,
 *   autoFollowupDays?: number  // schedule an auto-followup N days out (0 = none)
 *   outboundKind?: "first_touch" | "manual_followup" | "ai_drafted"
 * }
 *
 * Sends a plain-text outreach email via Postmark. Writes:
 *   - a LeadEmail record (direction=outbound) with full subject/body/postmarkMessageId
 *   - updates the Lead's legacy emailSubject/emailBody/emailedAt fields (back-compat)
 *   - bumps status to "emailed" or "followed_up"
 *   - increments followUpCount if not first touch
 *   - sets autoFollowupAt if autoFollowupDays > 0
 */
export async function POST(req: Request, { params }: Params) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let payload: {
    subject?: string;
    body?: string;
    fromOverride?: string;
    autoFollowupDays?: number;
    outboundKind?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = (payload.subject || "").trim();
  const body = (payload.body || "").trim();
  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });
  }

  const result = await sendOutreachEmail({
    to: lead.email,
    subject,
    body,
    fromOverride: payload.fromOverride,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 500 });
  }

  const wasAlreadyEmailed = Boolean(lead.emailedAt);
  const newStatus = wasAlreadyEmailed ? "followed_up" : "emailed";
  const outboundKind =
    payload.outboundKind ||
    (wasAlreadyEmailed ? "manual_followup" : "first_touch");

  // Optional auto-followup scheduling
  let autoFollowupAt: Date | null = null;
  const days = Number(payload.autoFollowupDays);
  if (Number.isFinite(days) && days > 0) {
    autoFollowupAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  // Write the LeadEmail history record + update the Lead in a transaction
  const [, updated] = await prisma.$transaction([
    prisma.leadEmail.create({
      data: {
        leadId: lead.id,
        direction: "outbound",
        subject,
        body,
        fromAddr: result.from,
        toAddr: lead.email,
        sentByUserId: userId,
        postmarkMessageId: result.messageId,
        outboundKind,
      },
    }),
    prisma.lead.update({
      where: { id },
      data: {
        emailSubject: subject,
        emailBody: body,
        emailedAt: new Date(),
        status: newStatus,
        // Always clear any pending review-queue draft on successful send.
        // This is the single point where drafts get retired.
        draftSubject: null,
        draftBody: null,
        draftMode: null,
        draftSource: null,
        draftCreatedAt: null,
        ...(wasAlreadyEmailed && {
          followUpCount: { increment: 1 },
          lastFollowUpAt: new Date(),
        }),
        ...(autoFollowupAt && {
          autoFollowupAt,
          autoFollowupSent: false,
        }),
      },
    }),
  ]);

  return NextResponse.json({ ok: true, lead: updated });
}
