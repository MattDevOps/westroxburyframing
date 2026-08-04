import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendMailInInvoiceEmail } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /staff/api/orders/[id]/email-mail-invoice
 * Email a mail-in invoice (pay by check / PayPal) to the customer.
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
              vendor: { select: { name: true, code: true } },
            },
          },
        },
        orderBy: { position: "asc" },
      },
      payments: {
        where: { status: "paid" },
        select: { amount: true },
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

  let discountAmount = 0;
  if (order.discountType === "percent" && Number(order.discountValue) > 0) {
    discountAmount = Math.round((order.subtotalAmount * Number(order.discountValue)) / 100);
  } else if (order.discountType === "fixed" && Number(order.discountValue) > 0) {
    discountAmount = Math.round(Number(order.discountValue) * 100);
  }

  const subtotalAfterDiscount = order.subtotalAmount - discountAmount;
  const amountPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, order.totalAmount - amountPaid);

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  if (lineItems.length === 0) {
    lineItems.push({
      description: order.itemDescription
        ? `${order.itemType} — ${order.itemDescription}`
        : order.itemType || "Custom framing",
      quantity: 1,
      unitPrice: `$${(order.subtotalAmount / 100).toFixed(2)}`,
      lineTotal: `$${(order.subtotalAmount / 100).toFixed(2)}`,
    });
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || "https://www.westroxburyframing.com";
  const invoiceUrl = `${baseUrl}/api/invoice/${order.id}`;

  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const size =
    order.width && order.height
      ? `${Number(order.width).toFixed(2)}" × ${Number(order.height).toFixed(2)}"`
      : undefined;

  try {
    const result = await sendMailInInvoiceEmail({
      to: order.customer.email,
      customerName,
      orderNumber: order.orderNumber,
      orderDate,
      itemType: order.itemType,
      itemDescription: order.itemDescription,
      size,
      lineItems,
      subtotal: `$${(order.subtotalAmount / 100).toFixed(2)}`,
      discountAmount: discountAmount > 0 ? `$${(discountAmount / 100).toFixed(2)}` : undefined,
      subtotalAfterDiscount: `$${(subtotalAfterDiscount / 100).toFixed(2)}`,
      tax: `$${(order.taxAmount / 100).toFixed(2)}`,
      total: `$${(order.totalAmount / 100).toFixed(2)}`,
      amountDue: `$${(amountDue / 100).toFixed(2)}`,
      invoiceUrl,
      notes: order.notesCustomer || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    await prisma.orderActivity.create({
      data: {
        orderId: order.id,
        type: "mail_in_invoice_sent",
        message: `Mail-in invoice emailed to ${order.customer.email}`,
        createdByUserId: userId,
      },
    });

    return NextResponse.json({
      ok: true,
      sentTo: order.customer.email,
    });
  } catch (err: any) {
    console.error("Failed to email mail-in invoice:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
