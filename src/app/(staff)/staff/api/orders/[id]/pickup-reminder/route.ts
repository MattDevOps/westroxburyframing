import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendReadyForPickupEmail } from "@/lib/email";
import { sendPickupReminderSMS, hasSMSOptIn } from "@/lib/sms";

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

  if (!order.customer) {
    return NextResponse.json(
      { error: "Order has no customer associated." },
      { status: 400 }
    );
  }

  const email = order.customer.email;
  if (!email) {
    return NextResponse.json(
      { error: "Customer has no email address on file." },
      { status: 400 }
    );
  }

  const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer";

  const results: { email?: boolean; sms?: boolean; errors?: string[] } = {};

  // Send email
  if (email) {
    const emailResult = await sendReadyForPickupEmail({
      to: email,
      orderNumber: order.orderNumber,
      customerName,
    });
    
    if (emailResult.ok) {
      results.email = true;
    } else {
      results.errors = results.errors || [];
      results.errors.push(`Email: ${emailResult.error || "Failed"}`);
    }
  }

  // Send SMS if phone available and customer has opted in
  if (order.customer.phone && hasSMSOptIn(order.customer)) {
    const smsResult = await sendPickupReminderSMS({
      to: order.customer.phone,
      orderNumber: order.orderNumber,
      customerName,
    });
    
    if (smsResult.ok) {
      results.sms = true;
    } else if (smsResult.error && !smsResult.error.includes("not configured")) {
      results.errors = results.errors || [];
      results.errors.push(`SMS: ${smsResult.error || "Failed"}`);
    }
  } else if (order.customer.phone && !hasSMSOptIn(order.customer)) {
    // Customer has phone but hasn't opted in
    results.errors = results.errors || [];
    results.errors.push("SMS: Customer has not opted in to SMS notifications");
  }

  // Log activity
  const messages: string[] = [];
  if (results.email) messages.push(`Email sent to ${email}`);
  if (results.sms) messages.push(`SMS sent to ${order.customer.phone}`);
  if (results.errors && results.errors.length > 0) {
    messages.push(`Errors: ${results.errors.join(", ")}`);
  }

  if (messages.length > 0) {
    await prismaWithActivity.orderActivity.create({
      data: {
        orderId: id,
        type: "note",
        message: `Pickup reminder: ${messages.join("; ")}`,
        createdByUserId: userId,
      },
    });
  }

  // Return error only if both failed (or email failed and no SMS attempted)
  if (!results.email && !results.sms) {
    return NextResponse.json(
      { error: results.errors?.join("; ") || "Failed to send pickup reminder" },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    ok: true, 
    email: results.email ? email : undefined,
    sms: results.sms ? order.customer.phone : undefined,
    errors: results.errors,
  });
}
