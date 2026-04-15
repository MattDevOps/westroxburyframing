import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendPickupReadyCustomerEmail } from "@/lib/email";

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

  const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";

  const emailResult = await sendPickupReadyCustomerEmail({
    to: customer.email,
    customerName,
  });

  await prisma.activityLog.create({
    data: {
      entityType: "customer",
      entityId: customer.id,
      action: emailResult.ok ? "pickup_email_sent" : "pickup_email_failed",
      actorUserId: userId,
      metadata: {
        email: customer.email,
        error: emailResult.error || null,
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
