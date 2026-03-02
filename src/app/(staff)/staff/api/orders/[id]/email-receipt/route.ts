import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendReceiptToCustomer } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/orders/[id]/email-receipt
 * Email a receipt to the customer
 */
export async function POST(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      components: {
        include: {
          priceCode: true,
          vendorItem: {
            include: {
              vendor: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
      location: {
        select: {
          name: true,
          address: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.customer) {
    return NextResponse.json(
      { error: "Order has no customer associated" },
      { status: 400 }
    );
  }

  if (!order.customer.email) {
    return NextResponse.json(
      { error: "Customer does not have an email address" },
      { status: 400 }
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (order.discountType === "percent" && Number(order.discountValue) > 0) {
    discountAmount = Math.round((order.subtotalAmount * Number(order.discountValue)) / 100);
  } else if (order.discountType === "fixed" && Number(order.discountValue) > 0) {
    discountAmount = Math.round(Number(order.discountValue) * 100);
  }

  const subtotalAfterDiscount = order.subtotalAmount - discountAmount;
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Build line items from components
  const lineItems = order.components.map((comp) => {
    const description =
      comp.description ||
      comp.vendorItem?.description ||
      comp.priceCode?.name ||
      `${comp.category} (${comp.quantity})`;
    return {
      description,
      quantity: Number(comp.quantity),
      unitPrice: `$${(comp.unitPrice / 100).toFixed(2)}`,
      lineTotal: `$${(comp.lineTotal / 100).toFixed(2)}`,
    };
  });

  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const receiptUrl = `${baseUrl}/staff/api/orders/${order.id}/receipt`;

  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const size = order.width && order.height
    ? `${Number(order.width).toFixed(2)}" × ${Number(order.height).toFixed(2)}"`
    : undefined;

  try {
    const result = await sendReceiptToCustomer({
      to: order.customer.email,
      customerName,
      orderNumber: order.orderNumber,
      orderDate: date,
      itemType: order.itemType,
      itemDescription: order.itemDescription || undefined,
      size,
      lineItems,
      subtotal: `$${(order.subtotalAmount / 100).toFixed(2)}`,
      discountAmount: discountAmount > 0 ? `$${(discountAmount / 100).toFixed(2)}` : undefined,
      subtotalAfterDiscount: `$${(subtotalAfterDiscount / 100).toFixed(2)}`,
      tax: `$${(order.taxAmount / 100).toFixed(2)}`,
      total: `$${(order.totalAmount / 100).toFixed(2)}`,
      paymentStatus: order.paidInFull ? "Paid in Full" : `Balance Due: $${(order.totalAmount / 100).toFixed(2)}`,
      notes: order.notesCustomer || undefined,
      receiptUrl,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sentTo: order.customer.email,
    });
  } catch (err: any) {
    console.error("Failed to email receipt:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
