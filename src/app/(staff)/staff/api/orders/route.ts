import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { getLocationFilter } from "@/lib/location";
import { nextOrderNumber } from "@/lib/ids";
import { calculateOrderPrice, type PricingComponent } from "@/lib/pricing";
import { sendOrderReceivedEmail } from "@/lib/email";
import { handleApiError, AppError, validateRequired } from "@/lib/apiErrorHandler";
import { validateDimensions, validatePricing, validateDiscount, validateComponents } from "@/lib/validation";
import { logOrderCreated } from "@/lib/activityLogger";

export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParams = searchParams.getAll("status").filter(Boolean);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 5000);
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const itemType = (searchParams.get("item_type") || "").trim();
  const customerId = searchParams.get("customerId") || "";
  const createdByUserId = searchParams.get("createdByUserId") || "";
  const locationIdFilter = searchParams.get("locationId") || "";

  // Get location filter
  const locationFilter = await getLocationFilter(req);

  // Build WHERE clause
  const where: Record<string, unknown> = { ...locationFilter };
  if (statusParams.length === 1) where.status = statusParams[0];
  else if (statusParams.length > 1) where.status = { in: statusParams };
  if (itemType) where.itemType = itemType;
  if (customerId) where.customerId = customerId;
  if (createdByUserId) where.createdByUserId = createdByUserId;
  if (locationIdFilter) where.locationId = locationIdFilter;

  // Date range filter
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      createdAt.lte = toDate;
    }
    where.createdAt = createdAt;
  }

  // Text search
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { firstName: { contains: q, mode: "insensitive" } } },
      { customer: { lastName: { contains: q, mode: "insensitive" } } },
      { customer: { phone: { contains: q } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: { customer: true, payments: true, createdBy: { select: { name: true } }, location: { select: { name: true } } },
  });

  return NextResponse.json({
    orders: orders.map((o) => {
      const invStatus = o.squareInvoiceStatus?.toUpperCase();
      const hasPayment = o.payments.length > 0;
      const paidStatus =
        hasPayment || invStatus === "PAID"
          ? "paid"
          : invStatus === "PARTIALLY_PAID"
            ? "deposit"
            : "unpaid";
      return {
        id: o.id,
        order_number: o.orderNumber,
        orderNumber: o.orderNumber,
        status: o.status,
        due_date: o.dueDate,
        customer_name: `${o.customer.firstName} ${o.customer.lastName}`,
        customer_email: o.customer.email || "",
        total_cents: o.totalAmount,
        totalAmount: o.totalAmount,
        paid: paidStatus !== "unpaid",
        paid_status: paidStatus,
        item_type: o.itemType,
        itemType: o.itemType || "",
        invoiceId: o.invoiceId || null,
        created_by_user_id: o.createdByUserId || null,
        location_id: o.locationId || null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get current location for new orders
    const locationFilter = await getLocationFilter(req);
    if (!locationFilter.locationId) {
      throw new AppError("Location required. Please select a location.", 400, "LOCATION_REQUIRED");
    }

    const body = await req.json();

    // Validate required fields
    validateRequired(body, ["customer_id", "item_type"]);

    // Validate dimensions if provided
    if (body.width !== undefined || body.height !== undefined) {
      const dimValidation = validateDimensions(body.width, body.height, body.units || "in");
      if (!dimValidation.valid) {
        throw new AppError(dimValidation.errors.join(", "), 400, "VALIDATION_ERROR");
      }
    }

    const last = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = nextOrderNumber(last?.orderNumber);

    // Determine initial status (default: new_design, or "estimate" if requested)
    const requestedStatus = body.status === "estimate" ? "estimate" : "new_design";

    // Phase 2C: Support OrderComponent (new) or OrderSpecs (legacy)
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let componentsData: any[] = [];

    if (body.components && Array.isArray(body.components) && body.components.length > 0) {
      // Validate components
      const compValidation = validateComponents(body.components);
      if (!compValidation.valid) {
        throw new AppError(compValidation.errors.join(", "), 400, "VALIDATION_ERROR");
      }

      // New: Use OrderComponent with pricing calculation
      const width = Number(body.width) || 0;
      const height = Number(body.height) || 0;

      if (width <= 0 || height <= 0) {
        throw new AppError("Width and height are required when using components", 400, "VALIDATION_ERROR");
      }

      // Fetch price codes
      const priceCodeIds = body.components
        .map((c: any) => c.priceCodeId)
        .filter(Boolean) as string[];

      const priceCodes = await prisma.priceCode.findMany({
        where: { id: { in: priceCodeIds }, active: true },
      });

      const priceCodeMap = new Map(
        priceCodes.map((pc) => [
          pc.id,
          {
            id: pc.id,
            code: pc.code,
            category: pc.category,
            formula: pc.formula,
            baseRate: Number(pc.baseRate),
            minCharge: Number(pc.minCharge),
            wastePercent: Number(pc.wastePercent),
            multiplier: Number(pc.multiplier),
          },
        ])
      );

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

      subtotal = pricingResult.subtotal;
      tax = body.tax_rate ? Math.round(subtotal * Number(body.tax_rate)) : 0;
      total = subtotal + tax;

      // Prepare components data
      componentsData = body.components.map((c: any, idx: number) => {
        const lineItem = pricingResult.lineItems[idx];
        return {
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
    } else {
      // Legacy: Use OrderSpecs with manual pricing
      const pricing = body.pricing || {};
      subtotal = Number(pricing.subtotal_cents ?? -1);
      tax = Number(pricing.tax_cents ?? -1);
      total = Number(pricing.total_cents ?? -1);

      if (subtotal < 0 || tax < 0 || total < 0) {
        throw new AppError("Invalid payload: pricing required", 400, "VALIDATION_ERROR");
      }
    }

    // Apply order-level discount
    const discountType = body.discount_type || "none";
    const discountValue = body.discount_value != null ? Number(body.discount_value) : 0;
    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = Math.round(subtotal * discountValue / 100);
    } else if (discountType === "fixed") {
      discountAmount = Math.round(discountValue * 100);
    }
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const finalTax = body.tax_rate ? Math.round(afterDiscount * Number(body.tax_rate)) : tax;
    const finalTotal = afterDiscount + finalTax;

    // Validate pricing
    const pricingValidation = validatePricing(afterDiscount, finalTax, finalTotal);
    if (!pricingValidation.valid) {
      throw new AppError(pricingValidation.errors.join(", "), 400, "VALIDATION_ERROR");
    }

    // Validate discount if provided
    if (discountType !== "none") {
      const discountValidation = validateDiscount(discountType, discountValue, subtotal);
      if (!discountValidation.valid) {
        throw new AppError(discountValidation.errors.join(", "), 400, "VALIDATION_ERROR");
      }
    }

    const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: body.customer_id,
      locationId: locationFilter.locationId!,
      status: requestedStatus as any,
      intakeChannel: body.intake_channel || "walk_in",
      dueDate: body.due_date ? new Date(body.due_date) : null,
      itemType: body.item_type,
      itemDescription: body.item_description || null,
      width: body.width ?? null,
      height: body.height ?? null,
      units: body.units === "cm" ? "cm" : "in",
      notesInternal: body.notes_internal || null,
      notesCustomer: body.notes_customer || null,
      subtotalAmount: afterDiscount,
      discountType,
      discountValue,
      taxAmount: finalTax,
      totalAmount: finalTotal,
      currency: "USD",
      paidInFull: true,
      createdByUserId: userId,
      // Phase 2C: Create components if provided, otherwise create legacy specs
      ...(componentsData.length > 0
        ? {
            components: {
              create: componentsData,
            },
          }
        : {
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
          }),
    },
    include: { customer: true },
  });

    // Enhanced activity logging
    await logOrderCreated({
      orderId: order.id,
      orderNumber,
      userId,
      customerId: body.customer_id,
      totalAmount: finalTotal,
      status: requestedStatus,
      metadata: {
        intakeChannel: body.intake_channel || "walk_in",
        componentsCount: componentsData.length,
        hasDiscount: discountType !== "none",
      },
    });

    // Purchase Order Automation: Materials are automatically tracked via materials-needed endpoint
    // When order uses vendor items, they'll appear in the materials needed view
    // No additional action needed here - the materials-needed API calculates requirements dynamically

    // Send order received email to customer (if email available and not an estimate)
    if (order.customer.email && requestedStatus !== "estimate") {
      const estimatedTotal = finalTotal > 0 ? `$${(finalTotal / 100).toFixed(2)}` : undefined;
      sendOrderReceivedEmail({
        to: order.customer.email,
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer",
        itemType: order.itemType || undefined,
        itemDescription: order.itemDescription || undefined,
        estimatedTotal,
        dueDate: order.dueDate || undefined,
      }).catch((err) => {
        console.error("Failed to send order received email:", err);
      });
    }

    return NextResponse.json({
      order: { id: order.id, order_number: order.orderNumber, status: order.status },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
