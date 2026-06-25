import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendCustomerReplyEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/inbox/[id]/reply
 * Send an email reply to the customer and record it on the thread.
 * Body: { body: string }
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const payload = await req.json().catch(() => ({}));
  const replyBody = (payload.body ?? "").toString().trim();

  if (!replyBody) {
    return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
  }

  const message = await prisma.customerMessage.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!message.email) {
    return NextResponse.json(
      { error: "This message has no email address — reply by phone instead." },
      { status: 400 },
    );
  }

  const staff = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const emailResult = await sendCustomerReplyEmail({
    toEmail: message.email,
    toName: message.name,
    subject: message.subject || "Your message to West Roxbury Framing",
    replyBody,
    originalMessage: message.body,
    staffName: staff?.name || undefined,
  });

  // Record the reply regardless of send outcome so staff have an audit trail.
  const reply = await prisma.customerMessageReply.create({
    data: {
      messageId: id,
      direction: "outbound",
      fromUserId: userId,
      fromUserName: staff?.name || null,
      body: replyBody,
      emailOk: emailResult.ok,
      emailError: emailResult.ok ? null : emailResult.error || "Unknown error",
    },
  });

  if (emailResult.ok) {
    await prisma.customerMessage.update({
      where: { id },
      data: { status: "replied", read: true, readAt: message.readAt || new Date() },
    });
  }

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: `Reply saved but email failed to send: ${emailResult.error || "unknown error"}`, reply },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, reply });
}
