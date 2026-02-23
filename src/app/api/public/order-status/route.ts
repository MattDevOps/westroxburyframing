import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 10, windowSeconds: 60 }); // 10 per minute

/**
 * POST /api/public/order-status
 * Public order status lookup. Customer provides order number + email or phone.
 * Returns order status, due date, item info, and payment link (if any).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();

    const orderNumber = (body.order_number ?? "").toString().trim().toUpperCase();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const phone = (body.phone ?? "").toString().replace(/\D/g, "").trim();

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Please enter your order number." },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Please enter the email or phone number associated with your order." },
        { status: 400 }
      );
    }

    // Find order by order number
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: "insensitive" },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order with that number. Please double-check and try again." },
        { status: 404 }
      );
    }

    // Verify the customer identity (must match email or phone)
    const customerEmail = (order.customer.email ?? "").toLowerCase();
    const customerPhone = (order.customer.phone ?? "").replace(/\D/g, "");

    const emailMatch = email && customerEmail && customerEmail === email;
    const phoneMatch = phone && customerPhone && customerPhone.endsWith(phone.slice(-10));

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json(
        { error: "The contact information doesn't match our records for this order. Please try a different email or phone." },
        { status: 403 }
      );
    }

    // Build the public-safe status response
    const STATUS_MESSAGES: Record<string, { label: string; description: string; step: number }> = {
      estimate: {
        label: "Estimate Pending",
        description: "We're preparing your estimate. We'll reach out soon with pricing details.",
        step: 0,
      },
      new_design: {
        label: "Design Phase",
        description: "Your order has been received and is in the design phase.",
        step: 1,
      },
      awaiting_materials: {
        label: "Sourcing Materials",
        description: "We've finalized the design and are sourcing the materials for your frame.",
        step: 2,
      },
      in_production: {
        label: "In Production",
        description: "Your custom frame is being built by our craftspeople.",
        step: 3,
      },
      quality_check: {
        label: "Quality Check",
        description: "Your frame is assembled and undergoing our quality inspection.",
        step: 4,
      },
      ready_for_pickup: {
        label: "Ready for Pickup!",
        description: "Great news — your order is complete and ready for pickup at our shop!",
        step: 5,
      },
      on_hold: {
        label: "On Hold",
        description: "Your order is currently on hold. Please contact us for more information.",
        step: -1,
      },
      picked_up: {
        label: "Picked Up",
        description: "You've picked up your order. Thank you for choosing West Roxbury Framing!",
        step: 6,
      },
      completed: {
        label: "Completed",
        description: "Your order is complete. Thank you for choosing West Roxbury Framing!",
        step: 6,
      },
      cancelled: {
        label: "Cancelled",
        description: "This order has been cancelled. Please contact us if you have questions.",
        step: -1,
      },
    };

    const statusInfo = STATUS_MESSAGES[order.status] || {
      label: order.status,
      description: "Please contact us for the latest update on your order.",
      step: 0,
    };

    // Payment info (public-safe)
    const invoiceStatus = order.squareInvoiceStatus?.toUpperCase();
    let paymentLabel = "Pending";
    if (invoiceStatus === "PAID") paymentLabel = "Paid in full";
    else if (invoiceStatus === "PARTIALLY_PAID") paymentLabel = "Deposit received";
    else if (order.paidInFull) paymentLabel = "Paid in full";

    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        customerFirstName: order.customer.firstName,
        itemType: order.itemType,
        itemDescription: order.itemDescription || null,
        status: statusInfo.label,
        statusKey: order.status,
        statusDescription: statusInfo.description,
        statusStep: statusInfo.step,
        dueDate: order.dueDate ? order.dueDate.toISOString() : null,
        paymentStatus: paymentLabel,
        paymentLink: order.squareInvoiceUrl || null,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Order status lookup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or call us at 617-327-3890." },
      { status: 500 }
    );
  }
}
