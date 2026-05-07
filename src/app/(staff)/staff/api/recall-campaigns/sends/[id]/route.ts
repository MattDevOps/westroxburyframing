import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendRecallCampaignEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/recall-campaigns/sends/[id]
 * Action body: { action: "approve" | "discard" }
 *  - approve: actually sends the email via Postmark, then marks status=approved
 *  - discard: marks status=discarded (no send)
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action !== "approve" && action !== "discard") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const send = await prisma.recallCampaignSend.findUnique({
    where: { id },
    include: { customer: { select: { email: true } } },
  });
  if (!send) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (send.status !== "pending_review") {
    return NextResponse.json(
      { error: `Cannot ${action} — current status is ${send.status}` },
      { status: 400 },
    );
  }

  if (action === "discard") {
    await prisma.recallCampaignSend.update({
      where: { id },
      data: { status: "discarded" },
    });
    return NextResponse.json({ ok: true, status: "discarded" });
  }

  // approve = send now
  if (!send.customer.email) {
    return NextResponse.json(
      { error: "Customer no longer has an email on file" },
      { status: 400 },
    );
  }

  const result = await sendRecallCampaignEmail({
    to: send.customer.email,
    subject: send.renderedSubject,
    bodyHtml: send.renderedBodyHtml,
    bodyText: send.renderedBodyText,
  });

  if (!result.ok) {
    await prisma.recallCampaignSend.update({
      where: { id },
      data: { errorMessage: result.error || "Send failed" },
    });
    return NextResponse.json(
      { error: result.error || "Send failed" },
      { status: 500 },
    );
  }

  await prisma.recallCampaignSend.update({
    where: { id },
    data: {
      status: "sent",
      approvedAt: new Date(),
      sentAt: new Date(),
      postmarkMessageId: result.messageId || null,
      errorMessage: null,
    },
  });

  return NextResponse.json({ ok: true, status: "sent" });
}
