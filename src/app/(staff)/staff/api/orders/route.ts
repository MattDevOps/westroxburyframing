import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { nextOrderNumber } from "@/lib/ids";

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const where = status ? { status: status as any } : {};
  const orders = await prisma.order.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { customer: true, payments: true },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      status: o.status,
      due_date: o.dueDate,
      customer_name: `${o.customer.firstName} ${o.customer.lastName}`,
      total_cents: o.totalAmount,
      paid: o.payments.length > 0 || (o.squareInvoiceStatus?.toUpperCase() === "PAID"),
      item_type: o.itemType,
    })),
  });
}

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const last = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });
  const orderNumber = nextOrderNumber(last?.orderNumber);

  const pricing = body.pricing || {};
  const subtotal = Number(pricing.subtotal_cents ?? -1);
  const tax = Number(pricing.tax_cents ?? -1);
  const total = Number(pricing.total_cents ?? -1);

  if (!body.customer_id || !body.item_type || subtotal < 0 || tax < 0 || total < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: body.customer_id,
      intakeChannel: body.intake_channel || "walk_in",
      dueDate: body.due_date ? new Date(body.due_date) : null,
      itemType: body.item_type,
      itemDescription: body.item_description || null,
      width: body.width ?? null,
      height: body.height ?? null,
      units: body.units === "cm" ? "cm" : "in",
      notesInternal: body.notes_internal || null,
      notesCustomer: body.notes_customer || null,
      subtotalAmount: subtotal,
      taxAmount: tax,
      totalAmount: total,
      currency: "USD",
      paidInFull: true,
      createdByUserId: userId,
      specs: {
        create: {
          frameCode: body.specs?.frame_code || null,
          frameVendor: body.specs?.frame_vendor || null,
          mat1Code: body.specs?.mat_1_code || null,
          mat2Code: body.specs?.mat_2_code || null,
          glassType: body.specs?.glass_type || null,
          mountType: body.specs?.mount_type || null,
          backingType: body.specs?.backing_type || null,
          spacers: Boolean(body.specs?.spacers),
          specialtyType: body.specs?.specialty_type || null,
        },
      },
    },
    include: { customer: true },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "order",
      entityId: order.id,
      orderId: order.id,
      action: "order_created",
      actorUserId: userId,
      metadata: { orderNumber },
    },
  });

  return NextResponse.json({
    order: { id: order.id, order_number: order.orderNumber, status: order.status },
  });
}
