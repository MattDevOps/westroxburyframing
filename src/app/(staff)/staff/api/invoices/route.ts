import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";
import { nextInvoiceNumber } from "@/lib/ids";

/**
 * GET /staff/api/invoices
 * List invoices with optional filters: customerId, status, search
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locationFilter = await getLocationFilter(req);

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  
  // Filter invoices by location through their orders
  if (locationFilter.locationId) {
    where.orders = {
      some: {
        locationId: locationFilter.locationId,
      },
    };
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { firstName: { contains: search, mode: "insensitive" } } },
      { customer: { lastName: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
      orders: {
        select: { id: true, orderNumber: true, totalAmount: true, status: true },
      },
      payments: {
        select: { id: true, amount: true, method: true, status: true, paidAt: true },
        orderBy: { paidAt: "desc" },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({ invoices });
}

/**
 * POST /staff/api/invoices
 * Create a new invoice. Can optionally link existing orders.
 *
 * Body: {
 *   customerId: string,
 *   orderIds?: string[],          // orders to attach
 *   depositPercent?: number,      // e.g. 50
 *   notes?: string,
 *   // If no orderIds, provide amounts directly:
 *   subtotalAmount?: number,      // cents
 *   taxAmount?: number,           // cents
 *   discountAmount?: number,      // cents
 * }
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  // Verify customer exists
  const customer = await prisma.customer.findUnique({ where: { id: body.customerId } });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Generate invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const invoiceNumber = nextInvoiceNumber(lastInvoice?.invoiceNumber);

  // Calculate totals from linked orders or manual amounts
  let subtotalAmount = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let totalAmount = 0;
  let orderIds: string[] = body.orderIds || [];

  if (orderIds.length > 0) {
    // Sum up from linked orders
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, customerId: body.customerId },
      select: { id: true, subtotalAmount: true, taxAmount: true, totalAmount: true, discountType: true, discountValue: true },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "No valid orders found for this customer" }, { status: 400 });
    }

    orderIds = orders.map((o) => o.id);

    for (const o of orders) {
      subtotalAmount += o.subtotalAmount;
      taxAmount += o.taxAmount;
      totalAmount += o.totalAmount;
      // Calculate discount amount per order
      const dType = o.discountType || "none";
      const dVal = Number(o.discountValue) || 0;
      if (dType === "percent") {
        discountAmount += Math.round(o.subtotalAmount * dVal / 100);
      } else if (dType === "fixed") {
        discountAmount += Math.round(dVal * 100);
      }
    }
  } else {
    // Manual amounts (for invoice-only creation without existing orders)
    subtotalAmount = body.subtotalAmount || 0;
    taxAmount = body.taxAmount || 0;
    discountAmount = body.discountAmount || 0;
    totalAmount = subtotalAmount - discountAmount + taxAmount;
  }

  if (totalAmount < 1) {
    return NextResponse.json({ error: "Invoice total must be at least $0.01" }, { status: 400 });
  }

  // Deposit calculation
  const depositPercent = typeof body.depositPercent === "number" ? body.depositPercent : null;
  const depositAmount = depositPercent ? Math.max(1, Math.round(totalAmount * depositPercent / 100)) : 0;
  const balanceDue = totalAmount; // Initially, full amount is due

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: body.customerId,
      subtotalAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      depositPercent,
      depositAmount,
      amountPaid: 0,
      balanceDue,
      currency: "USD",
      status: "draft",
      notes: body.notes || null,
      createdByUserId: userId,
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  // Link orders to this invoice
  if (orderIds.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { invoiceId: invoice.id },
    });
  }

  return NextResponse.json({ invoice });
}
