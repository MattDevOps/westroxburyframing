import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { handleApiError, AppError } from "@/lib/apiErrorHandler";
import { logStatusChange } from "@/lib/activityLogger";
import { isValidOrderStatus, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { sendReadyForPickupEmail } from "@/lib/email";
import { sendPickupReminderSMS, sendOrderStatusUpdateSMS, hasSMSOptIn } from "@/lib/sms";
import { deductInventoryForOrder } from "@/lib/inventory";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await ctx.params;
    if (!id) throw new AppError("Missing order ID", 400, "VALIDATION_ERROR");

    const body = await req.json();
    const status = String(body.status || "");

    if (!isValidOrderStatus(status)) {
      throw new AppError(`Invalid status: ${status}`, 400, "VALIDATION_ERROR");
    }

    const prev = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!prev) throw new AppError("Order not found", 404, "NOT_FOUND");

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: { customer: true },
    });

    const fromLabel = ORDER_STATUS_LABEL[prev.status as keyof typeof ORDER_STATUS_LABEL] || prev.status;
    const toLabel = ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] || status;

    // Enhanced activity logging
    await logStatusChange({
      orderId: order.id,
      fromStatus: prev.status,
      toStatus: status,
      userId,
      reason: body.reason,
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
        // Update order with actual material cost (COGS)
        await prisma.order.update({
          where: { id },
          data: {
            materialCost: inventoryResult.materialCost,
          },
        });

        await prismaWithActivity.orderActivity.create({
          data: {
            orderId: order.id,
            type: "note",
            message: `Inventory deducted: ${inventoryResult.deducted} item(s). Material cost: $${(inventoryResult.materialCost / 100).toFixed(2)}`,
            createdByUserId: userId,
          },
        });
      }
    }

    const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer";
    
    // Send notifications for status changes
    if (status === "ready_for_pickup") {
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
    
    // Send SMS if phone available, opted in, and Twilio configured
    if (order.customer.phone && hasSMSOptIn(order.customer)) {
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
      } else {
        // Log all SMS errors, including configuration issues
        const errorMsg = smsResult.error || "Unknown error";
        await prismaWithActivity.orderActivity.create({
          data: {
            orderId: order.id,
            type: "note",
            message: `Pickup SMS failed: ${errorMsg}${errorMsg.includes("not configured") ? " (Check Vercel environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)" : ""}`,
            createdByUserId: userId,
          },
        });
        console.error("SMS send failed:", { orderNumber: order.orderNumber, phone: order.customer.phone, error: errorMsg });
      }
    }
  } else if (
    // Send SMS status updates for key status changes (if opted in)
    (status === "in_production" || status === "quality_check" || status === "completed") &&
    order.customer.phone &&
    hasSMSOptIn(order.customer)
  ) {
    const smsResult = await sendOrderStatusUpdateSMS({
      to: order.customer.phone,
      orderNumber: order.orderNumber,
      customerName,
      status,
      statusLabel: toLabel,
    });
    
    if (smsResult.ok) {
      await prismaWithActivity.orderActivity.create({
        data: {
          orderId: order.id,
          type: "note",
          message: `Status update SMS sent to ${order.customer.phone}`,
          createdByUserId: userId,
        },
      });
    } else {
      // Log all SMS errors, including configuration issues
      const errorMsg = smsResult.error || "Unknown error";
      await prismaWithActivity.orderActivity.create({
        data: {
          orderId: order.id,
          type: "note",
          message: `Status update SMS failed: ${errorMsg}${errorMsg.includes("not configured") ? " (Check Vercel environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)" : ""}`,
          createdByUserId: userId,
        },
      });
      console.error("SMS send failed:", { orderNumber: order.orderNumber, phone: order.customer.phone, error: errorMsg });
    }
  }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
