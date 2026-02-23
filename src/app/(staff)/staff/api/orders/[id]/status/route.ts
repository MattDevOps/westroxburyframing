import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { isValidOrderStatus, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { sendReadyForPickupEmail } from "@/lib/email";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const status = String(body.status || "");

  if (!isValidOrderStatus(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const prev = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!prev) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = await prisma.order.update({
    where: { id },
    data: { status: status as any },
    include: { customer: true },
  });

  const fromLabel = ORDER_STATUS_LABEL[prev.status as keyof typeof ORDER_STATUS_LABEL] || prev.status;
  const toLabel = ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] || status;

  // Write to both ActivityLog (legacy) and OrderActivity (timeline)
  await prisma.activityLog.create({
    data: {
      entityType: "order",
      entityId: order.id,
      orderId: order.id,
      action: "status_changed",
      actorUserId: userId,
      metadata: { from: prev.status, to: status },
    },
  });

  await prismaWithActivity.orderActivity.create({
    data: {
      orderId: order.id,
      type: "status_change",
      message: `Status changed: ${fromLabel} → ${toLabel}`,
      createdByUserId: userId,
    },
  });

  if (status === "ready_for_pickup" && order.customer.email) {
    await sendReadyForPickupEmail({
      to: order.customer.email,
      orderNumber: order.orderNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    });
  }

  return NextResponse.json({ ok: true });
}
