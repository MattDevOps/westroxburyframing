import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextOrderNumber, normalizeEmail, normalizePhone } from "@/lib/ids";
import { sendNewWebLeadNotification } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 15, windowSeconds: 600 }); // 15 per 10 min

/**
 * POST /api/public/quote
 * Public-facing quote request. Creates an estimate order and notifies staff.
 * Similar to /api/public/orders but creates an estimate instead of a full order.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = limiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    const firstName = (body.first_name ?? "").toString().trim();
    const lastName = (body.last_name ?? "").toString().trim();
    const phone = normalizePhone(body.phone ?? "");
    const email = normalizeEmail(body.email);
    const itemType = (body.item_type ?? "").toString().trim();
    const description = (body.description ?? "").toString().trim();
    const notes = (body.notes ?? "").toString().trim();
    const width = body.width ? Number(body.width) : null;
    const height = body.height ? Number(body.height) : null;
    const marketing = Boolean(body.marketing_opt_in);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: "Please provide a phone number or email so we can reach you." },
        { status: 400 }
      );
    }

    // Upsert customer by phone (or create new if no phone, keyed by generated placeholder)
    const customerPhone = phone || `web-${Date.now()}`;
    const customer = await prisma.customer.upsert({
      where: { phone: customerPhone },
      create: {
        firstName,
        lastName,
        phone: customerPhone,
        email,
        preferredContact: "email",
        marketingOptIn: marketing,
        marketingOptInAt: marketing ? new Date() : null,
      },
      update: {
        firstName,
        lastName,
        email: email || undefined,
        marketingOptIn: marketing,
        marketingOptInAt: marketing ? new Date() : undefined,
      },
    });

    // Generate order number
    const last = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = nextOrderNumber(last?.orderNumber);

    // Find a staff user to use as creator (first admin)
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "System not configured. Please contact us directly." },
        { status: 500 }
      );
    }

    // Get default location for the order
    const defaultLocation = await prisma.location.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    if (!defaultLocation) {
      return NextResponse.json(
        { error: "No active location configured. Please contact us directly." },
        { status: 500 }
      );
    }

    // Create order as estimate
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        locationId: defaultLocation.id,
        intakeChannel: "web_lead",
        status: "estimate",
        itemType: itemType || "other",
        itemDescription: description || null,
        width: width,
        height: height,
        units: "in",
        notesCustomer: notes || null,
        subtotalAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: "USD",
        paidInFull: false,
        createdByUserId: adminUser.id,
      },
    });

    // Save uploaded photos (base64 data URLs) if any
    const photos: string[] = Array.isArray(body.photos) ? body.photos : [];
    if (photos.length > 0) {
      for (const photoUrl of photos.slice(0, 6)) {
        if (typeof photoUrl === "string" && photoUrl.startsWith("data:image/")) {
          await prisma.orderPhoto.create({
            data: {
              orderId: order.id,
              url: photoUrl,
              caption: "Uploaded by customer (quote request)",
            },
          });
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: "order",
        entityId: order.id,
        orderId: order.id,
        action: "quote_request_submitted",
        metadata: { 
          orderNumber, 
          customerName: `${firstName} ${lastName}`, 
          photoCount: photos.length 
        },
      },
    });

    // Notify staff via email
    const emailResult = await sendNewWebLeadNotification({
      orderNumber,
      customerName: `${firstName} ${lastName}`,
      customerEmail: email || "N/A",
      customerPhone: phone || "N/A",
      itemType: itemType || "other",
      description: description || "N/A",
      notes: notes || "N/A",
    });
    
    if (!emailResult.ok) {
      console.error("Failed to send quote request notification email:", emailResult.error);
      // Log to activity log for visibility
      await prisma.activityLog.create({
        data: {
          entityType: "order",
          entityId: order.id,
          orderId: order.id,
          action: "web_lead_email_failed",
          metadata: { 
            orderNumber, 
            error: emailResult.error || "Unknown error",
            to: "jake@westroxburyframing.com",
            cc: "frameguy1@hotmail.com"
          },
        },
      });
    } else {
      console.log("Quote request notification email sent successfully:", { orderNumber, to: "jake@westroxburyframing.com", cc: "frameguy1@hotmail.com" });
    }

    return NextResponse.json({
      ok: true,
      order_number: order.orderNumber,
      message: "Quote request received. We'll get back to you soon!",
    });
  } catch (error: any) {
    console.error("Error processing quote request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process quote request. Please try again or call us." },
      { status: 500 }
    );
  }
}
