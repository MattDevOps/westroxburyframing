import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendPickupReadyCustomerEmail, sendOutreachEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if (!customer.email) {
    return NextResponse.json(
      { error: "Customer has no email address on file." },
      { status: 400 }
    );
  }

  // Optional custom subject + message override the canned pickup-ready email.
  const body = await req.json().catch(() => ({}));
  const customSubject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const customMessage = typeof body?.message === "string" ? body.message.trim() : "";

  const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";

  const emailResult = customMessage
    ? await sendOutreachEmail({
        to: customer.email,
        subject: customSubject || "A message from West Roxbury Framing",
        body: customMessage,
      })
    : await sendPickupReadyCustomerEmail({
        to: customer.email,
        customerName,
      });

  await prisma.activityLog.create({
    data: {
      entityType: "customer",
      entityId: customer.id,
      action: emailResult.ok
        ? customMessage ? "custom_email_sent" : "pickup_email_sent"
        : customMessage ? "custom_email_failed" : "pickup_email_failed",
      actorUserId: userId,
      metadata: {
        email: customer.email,
        error: emailResult.error || null,
        custom: customMessage ? true : false,
      } as any,
    },
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: emailResult.error || "Failed to send pickup email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    email: customer.email,
  });
}
