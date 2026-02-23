import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerIdFromRequest } from "@/lib/customerAuth";

export async function GET(req: Request) {
  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      preferredContact: true,
      marketingOptIn: true,
      createdAt: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
  }

  // Fetch orders
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      itemType: true,
      itemDescription: true,
      totalAmount: true,
      dueDate: true,
      createdAt: true,
      squareInvoiceUrl: true,
      squareInvoiceStatus: true,
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
          squareInvoiceUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, customer, orders });
}

export async function PATCH(req: Request) {
  const customerId = getCustomerIdFromRequest(req);
  if (!customerId) {
    return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if ("firstName" in body) data.firstName = String(body.firstName || "").trim();
  if ("lastName" in body) data.lastName = String(body.lastName || "").trim();
  if ("phone" in body) data.phone = String(body.phone || "").replace(/[^\d+]/g, "") || null;
  if ("preferredContact" in body) data.preferredContact = body.preferredContact === "call" ? "call" : "email";
  if ("marketingOptIn" in body) {
    data.marketingOptIn = Boolean(body.marketingOptIn);
    if (body.marketingOptIn) data.marketingOptInAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.customer.update({ where: { id: customerId }, data });

  return NextResponse.json({
    ok: true,
    customer: {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      phone: updated.phone,
    },
  });
}
