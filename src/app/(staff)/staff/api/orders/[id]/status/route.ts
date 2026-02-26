import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { isValidOrderStatus, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { sendReadyForPickupEmail } from "@/lib/email";
import { sendPickupReminderSMS } from "@/lib/sms";
import { deductInventoryForOrder } from "@/lib/inventory";

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

  // Phase 4A: Auto-deduct inventory when order moves to in_production
  if (status === "in_production" && prev.status !== "in_production") {
    const inventoryResult = await deductInventoryForOrder(id);
    if (inventoryResult.errors.length > 0) {
      // Log errors but don't fail the status change
      await prismaWithActivity.orderActivity.create({
        data: {
          orderId: order.id,
          type: "note",
          message: `Inventory deduction warnings: ${inventoryResult.errors.join("; ")}`,
          createdByUserId: userId,
        },
      });
    } else if (inventoryResult.deducted > 0) {
      await prismaWithActivity.orderActivity.create({
        data: {
          orderId: order.id,
          type: "note",
          message: `Inventory deducted: ${inventoryResult.deducted} item(s)`,
          createdByUserId: userId,
        },
      });
    }
  }

  if (status === "ready_for_pickup") {
    const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer";
    
    // Send email if available
    if (order.customer.email) {
      const emailResult = await sendReadyForPickupEmail({
        to: order.customer.email,
        orderNumber: order.orderNumber,
        customerName,
      });
      
      if (!emailResult.ok) {
        // Log the error but don't fail the status change
        await prismaWithActivity.orderActivity.create({
          data: {
            orderId: order.id,
            type: "note",
            message: `Pickup email failed: ${emailResult.error || "Unknown error"}`,
            createdByUserId: userId,
          },
        });
      }
    }
    
    // Send SMS if phone available and Twilio configured
    if (order.customer.phone) {
      const smsResult = await sendPickupReminderSMS({
        to: order.customer.phone,
        orderNumber: order.orderNumber,
        customerName,
      });
      
      if (smsResult.ok) {
        await prismaWithActivity.orderActivity.create({
          data: {
            orderId: order.id,
            type: "note",
            message: `Pickup SMS sent to ${order.customer.phone}`,
            createdByUserId: userId,
          },
        });
      } else if (smsResult.error && !smsResult.error.includes("not configured")) {
        // Only log if it's a real error, not just missing config
        await prismaWithActivity.orderActivity.create({
          data: {
            orderId: order.id,
            type: "note",
            message: `Pickup SMS failed: ${smsResult.error}`,
            createdByUserId: userId,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
