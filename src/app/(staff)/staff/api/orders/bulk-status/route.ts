import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { isValidOrderStatus, ORDER_STATUS_LABEL } from "@/lib/orderStatus";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

/**
 * POST /staff/api/orders/bulk-status
 * Bulk update order statuses.
 * Body: { orderIds: string[], status: string }
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
  const status = String(body.status || "");

  if (!orderIds.length) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  if (!isValidOrderStatus(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const toLabel = ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] || status;
  let updated = 0;

  for (const orderId of orderIds) {
    try {
      const prev = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, orderNumber: true },
      });
      if (!prev) continue;

      const fromLabel = ORDER_STATUS_LABEL[prev.status as keyof typeof ORDER_STATUS_LABEL] || prev.status;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          entityType: "order",
          entityId: orderId,
          orderId,
          action: "status_changed",
          actorUserId: userId,
          metadata: { from: prev.status, to: status, bulk: true },
        },
      });

      await prismaWithActivity.orderActivity.create({
        data: {
          orderId,
          type: "status_change",
          message: `Status changed: ${fromLabel} → ${toLabel} (bulk action)`,
          createdByUserId: userId,
        },
      });

      updated++;
    } catch (err) {
      console.error(`Failed to update order ${orderId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, updated });
}
