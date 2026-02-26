import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { isValidOrderStatus } from "@/lib/orderStatus";
import { updateInvoiceForOrderEdit } from "@/lib/square/invoices";
import { calculateOrderPrice } from "@/lib/pricing";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        specs: true,
        components: {
          include: {
            priceCode: true,
            vendorItem: {
              include: { vendor: { select: { name: true, code: true } } },
            },
          },
          orderBy: { position: "asc" },
        },
        scenarios: {
          include: {
            components: {
              include: {
                priceCode: true,
                vendorItem: {
                  include: { vendor: { select: { name: true, code: true } } },
                },
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        photos: true,
        payments: true,
        createdBy: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
            depositPercent: true,
            depositAmount: true,
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const activity = await prismaWithActivity.orderActivity.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ order: { ...order, activity } });
  } catch (error: any) {
    console.error("Error loading order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load order" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));

  const data: any = {};

  if ("orderNumber" in body) data.orderNumber = body.orderNumber ?? null;
  if ("intakeChannel" in body) data.intakeChannel = body.intakeChannel ?? null;

  if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if ("itemType" in body) data.itemType = body.itemType ?? null;
  if ("itemDescription" in body) data.itemDescription = body.itemDescription ?? null;

  if ("width" in body) data.width = body.width === "" || body.width == null ? null : Number(body.width);
  if ("height" in body) data.height = body.height === "" || body.height == null ? null : Number(body.height);
  if ("units" in body) data.units = body.units ?? null;

  if ("notesInternal" in body) data.notesInternal = body.notesInternal ?? null;
  if ("notesCustomer" in body) data.notesCustomer = body.notesCustomer ?? null;

  if ("status" in body) {
    const next = String(body.status || "").trim();
    if (!isValidOrderStatus(next)) {
      return NextResponse.json({ error: `Invalid status: ${next}` }, { status: 400 });
    }
    data.status = next;
  }

  if ("subtotalAmount" in body) data.subtotalAmount = body.subtotalAmount == null ? null : Number(body.subtotalAmount);
  if ("taxAmount" in body) data.taxAmount = body.taxAmount == null ? null : Number(body.taxAmount);
  if ("totalAmount" in body) data.totalAmount = body.totalAmount == null ? null : Number(body.totalAmount);
  if ("currency" in body) data.currency = body.currency ?? null;
  if ("paidInFull" in body) data.paidInFull = Boolean(body.paidInFull);

  // Discount fields
  if ("discountType" in body) data.discountType = body.discountType ?? "none";
  if ("discountValue" in body) data.discountValue = body.discountValue == null ? 0 : Number(body.discountValue);

  const prev = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      totalAmount: true,
      squareInvoiceId: true,
      squareInvoiceStatus: true,
      orderNumber: true,
      customerId: true,
    },
  });
  if (!prev) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updated = await prisma.order.update({ where: { id }, data, include: { customer: true } });

  const events: Array<{ type: string; message: string }> = [];
  events.push({ type: "edit", message: "Order updated" });

  if ("status" in data && prev.status !== data.status) {
    events.push({
      type: "status_change",
      message: `Status changed: ${prev.status || "—"} → ${data.status}`,
    });
  }

  for (const ev of events) {
    await prismaWithActivity.orderActivity.create({
      data: {
        orderId: id,
        type: ev.type,
        message: ev.message,
        createdByUserId: userId,
      },
    });
  }

  // If total changed and a Square invoice exists, update the invoice
  const totalChanged = "totalAmount" in data && prev.totalAmount !== data.totalAmount;
  if (totalChanged && prev.squareInvoiceId) {
    const locationId = process.env.SQUARE_LOCATION_ID;
    const customerEmail = updated.customer?.email;
    if (locationId && customerEmail) {
      const invoiceResult = await updateInvoiceForOrderEdit({
        squareInvoiceId: prev.squareInvoiceId,
        newTotalCents: updated.totalAmount,
        locationId,
        orderId: updated.orderNumber,
        customerEmail,
        customerGivenName: updated.customer?.firstName || undefined,
        customerFamilyName: updated.customer?.lastName || undefined,
      });
      if (invoiceResult) {
        await prisma.order.update({
          where: { id },
          data: {
            squareInvoiceId: invoiceResult.invoiceId,
            squareInvoiceUrl: invoiceResult.publicUrl,
            squareInvoiceStatus: invoiceResult.status,
          },
        });
        events.push({
          type: "invoice_sent",
          message: `Invoice updated with revised total: $${(updated.totalAmount / 100).toFixed(2)}`,
        });
      }
    }
  }

  // Update customer info if provided
  if (body.customerFirstName || body.customerLastName || body.customerPhone || body.customerEmail) {
    const order_ = await prisma.order.findUnique({ where: { id }, select: { customerId: true } });
    if (order_) {
      const custData: Record<string, unknown> = {};
      if ("customerFirstName" in body) custData.firstName = String(body.customerFirstName || "");
      if ("customerLastName" in body) custData.lastName = String(body.customerLastName || "");
      if ("customerPhone" in body && body.customerPhone) custData.phone = String(body.customerPhone);
      if ("customerEmail" in body) custData.email = body.customerEmail ? String(body.customerEmail) : null;
      if (Object.keys(custData).length > 0) {
        await prisma.customer.update({ where: { id: order_.customerId }, data: custData });
      }
    }
  }

  // Phase 2C: Update components if provided
  if (body.components && Array.isArray(body.components)) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { width: true, height: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const width = Number(order.width) || 0;
    const height = Number(order.height) || 0;

    if (width <= 0 || height <= 0) {
      return NextResponse.json(
        { error: "Order width and height must be set before adding components" },
        { status: 400 }
      );
    }

    // Fetch price codes
    const priceCodeIds = body.components
      .map((c: any) => c.priceCodeId)
      .filter(Boolean) as string[];

    const priceCodes = await prisma.priceCode.findMany({
      where: { id: { in: priceCodeIds }, active: true },
    });

    const priceCodeMap = new Map(priceCodes.map((pc) => [pc.id, pc]));

    // Calculate pricing
    const pricingResult = calculateOrderPrice(
      width,
      height,
      body.components.map((c: any) => ({
        category: String(c.category),
        priceCodeId: c.priceCodeId || undefined,
        vendorItemId: c.vendorItemId || undefined,
        description: c.description || undefined,
        quantity: c.quantity ? Number(c.quantity) : 1,
        unitType: c.unitType || undefined,
      })),
      priceCodeMap
    );

    // Delete existing components
    await prisma.orderComponent.deleteMany({ where: { orderId: id, scenarioId: null } });

    // Create new components
    const componentsData = body.components.map((c: any, idx: number) => {
      const lineItem = pricingResult.lineItems[idx];
      return {
        orderId: id,
        category: String(c.category),
        position: c.position !== undefined ? Number(c.position) : idx,
        priceCodeId: c.priceCodeId || null,
        vendorItemId: c.vendorItemId || null,
        description: c.description || lineItem?.description || null,
        quantity: c.quantity ? Number(c.quantity) : 1,
        unitPrice: lineItem?.unitPrice || 0,
        discount: c.discount ? Math.round(Number(c.discount) * 100) : 0,
        lineTotal: (lineItem?.lineTotal || 0) - (c.discount ? Math.round(Number(c.discount) * 100) : 0),
        notes: c.notes || null,
      };
    });

    await prisma.orderComponent.createMany({ data: componentsData });

    // Recalculate order totals
    const componentSubtotal = pricingResult.lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const componentDiscounts = componentsData.reduce((sum, c) => sum + c.discount, 0);
    const afterComponentDiscount = componentSubtotal - componentDiscounts;

    // Apply order-level discount
    const discountType = data.discountType || updated.discountType || "none";
    const discountValue = data.discountValue !== undefined ? data.discountValue : Number(updated.discountValue || 0);
    let orderDiscount = 0;
    if (discountType === "percent") {
      orderDiscount = Math.round(afterComponentDiscount * discountValue / 100);
    } else if (discountType === "fixed") {
      orderDiscount = Math.round(discountValue * 100);
    }

    const finalSubtotal = Math.max(0, afterComponentDiscount - orderDiscount);
    const taxRate = updated.taxAmount && updated.subtotalAmount > 0
      ? updated.taxAmount / updated.subtotalAmount
      : 0.0625; // Default 6.25% MA tax
    const finalTax = Math.round(finalSubtotal * taxRate);
    const finalTotal = finalSubtotal + finalTax;

    // Update order totals
    await prisma.order.update({
      where: { id },
      data: {
        subtotalAmount: finalSubtotal,
        taxAmount: finalTax,
        totalAmount: finalTotal,
      },
    });

    // Update the returned order
    updated.subtotalAmount = finalSubtotal;
    updated.taxAmount = finalTax;
    updated.totalAmount = finalTotal;
  }

  // Update specs if provided (legacy support)
  if (body.specs && typeof body.specs === "object") {
    const specsData: Record<string, unknown> = {};
    if ("frame_code" in body.specs) specsData.frameCode = body.specs.frame_code || null;
    if ("frame_vendor" in body.specs) specsData.frameVendor = body.specs.frame_vendor || null;
    if ("mat_1_code" in body.specs) specsData.mat1Code = body.specs.mat_1_code || null;
    if ("mat_2_code" in body.specs) specsData.mat2Code = body.specs.mat_2_code || null;
    if ("glass_type" in body.specs) specsData.glassType = body.specs.glass_type || null;
    if ("mount_type" in body.specs) specsData.mountType = body.specs.mount_type || null;
    if ("backing_type" in body.specs) specsData.backingType = body.specs.backing_type || null;
    if ("spacers" in body.specs) specsData.spacers = Boolean(body.specs.spacers);
    if ("specialty_type" in body.specs) specsData.specialtyType = body.specs.specialty_type || null;

    if (Object.keys(specsData).length > 0) {
      await prisma.orderSpecs.upsert({
        where: { orderId: id },
        create: { orderId: id, ...specsData },
        update: specsData,
      });
    }
  }

  return NextResponse.json({ ok: true, order: updated });
}

/**
 * DELETE /staff/api/orders/[id]
 * Permanently delete an order and its related records.
 */
export async function DELETE(req: Request, ctx: Ctx) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, invoiceId: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Delete related records first
  await prismaWithActivity.orderActivity.deleteMany({ where: { orderId: id } });
  await prisma.orderSpecs.deleteMany({ where: { orderId: id } });
  await prisma.orderPhoto.deleteMany({ where: { orderId: id } });
  await prisma.payment.deleteMany({ where: { orderId: id } });
  await prisma.activityLog.deleteMany({ where: { orderId: id } });

  // Unlink from invoice if linked
  if (order.invoiceId) {
    // Recalculate invoice totals after removing this order
    const siblingOrders = await prisma.order.findMany({
      where: { invoiceId: order.invoiceId, id: { not: id } },
      select: { subtotalAmount: true, taxAmount: true, totalAmount: true },
    });
    const newSubtotal = siblingOrders.reduce((s, o) => s + o.subtotalAmount, 0);
    const newTax = siblingOrders.reduce((s, o) => s + o.taxAmount, 0);
    const newTotal = siblingOrders.reduce((s, o) => s + o.totalAmount, 0);
    const inv = await prisma.invoice.findUnique({ where: { id: order.invoiceId }, select: { amountPaid: true } });
    await prisma.invoice.update({
      where: { id: order.invoiceId },
      data: {
        subtotalAmount: newSubtotal,
        taxAmount: newTax,
        totalAmount: newTotal,
        balanceDue: Math.max(0, newTotal - (inv?.amountPaid || 0)),
      },
    });
  }

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: "Order deleted" });
}
