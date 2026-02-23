import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendReadyForPickupEmail } from "@/lib/email";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/orders/[id]/pickup-reminder
 * Send a pickup reminder email for the given order.
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const email = order.customer.email;
  if (!email) {
    return NextResponse.json(
      { error: "Customer has no email address on file." },
      { status: 400 }
    );
  }

  const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer";

  const result = await sendReadyForPickupEmail({
    to: email,
    orderNumber: order.orderNumber,
    customerName,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to send pickup reminder email" },
      { status: 500 }
    );
  }

  // Log activity
  await prismaWithActivity.orderActivity.create({
    data: {
      orderId: id,
      type: "note",
      message: `Pickup reminder email sent to ${email}`,
      createdByUserId: userId,
    },
  });

  return NextResponse.json({ ok: true, sentTo: email });
}
