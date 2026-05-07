import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendRecallCampaignEmail } from "@/lib/email";

/**
 * POST /staff/api/recall-campaigns/sends/bulk
 * Body: { ids: string[], action: "approve" | "discard" }
 * Used by the review queue's "Approve all" / "Discard all" buttons.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  const action = body.action;

  if (ids.length === 0)
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  if (action !== "approve" && action !== "discard")
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  if (action === "discard") {
    const result = await prisma.recallCampaignSend.updateMany({
      where: { id: { in: ids }, status: "pending_review" },
      data: { status: "discarded" },
    });
    return NextResponse.json({ ok: true, discarded: result.count });
  }

  // approve = send each
  const sends = await prisma.recallCampaignSend.findMany({
    where: { id: { in: ids }, status: "pending_review" },
    include: { customer: { select: { email: true } } },
  });

  let sent = 0;
  const errors: Array<{ id: string; error: string }> = [];
  for (const s of sends) {
    if (!s.customer.email) {
      errors.push({ id: s.id, error: "no email" });
      continue;
    }
    const result = await sendRecallCampaignEmail({
      to: s.customer.email,
      subject: s.renderedSubject,
      bodyHtml: s.renderedBodyHtml,
      bodyText: s.renderedBodyText,
    });
    if (!result.ok) {
      errors.push({ id: s.id, error: result.error || "send failed" });
      await prisma.recallCampaignSend.update({
        where: { id: s.id },
        data: { errorMessage: result.error || "send failed" },
      });
      continue;
    }
    await prisma.recallCampaignSend.update({
      where: { id: s.id },
      data: {
        status: "sent",
        approvedAt: new Date(),
        sentAt: new Date(),
        postmarkMessageId: result.messageId || null,
        errorMessage: null,
      },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, errorCount: errors.length, errors });
}
