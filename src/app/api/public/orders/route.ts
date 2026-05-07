import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextOrderNumber, normalizeEmail, normalizePhone } from "@/lib/ids";
import { sendNewWebLeadNotification } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 15, windowSeconds: 600 }); // 15 per 10 min

/**
 * POST /api/public/orders
 * Public-facing order intake (web leads). No auth required.
 */
export async function POST(request: Request) {
    const ip = getClientIp(request);
    const { allowed } = limiter.check(ip);
    if (!allowed) {
        return NextResponse.json(
            { error: "Too many submissions. Please wait a few minutes and try again." },
            { status: 429 },
        );
    }

    try {
        const body = await request.json();

        const firstName = (body.first_name ?? "").toString().trim();
        const lastName = (body.last_name ?? "").toString().trim();
        const phone = normalizePhone(body.phone ?? "");
        const email = normalizeEmail(body.email);
        const itemType = (body.item_type ?? "").toString().trim();
        const description = (body.description ?? "").toString().trim();
        const notes = (body.notes ?? "").toString().trim();
        const marketing = Boolean(body.marketing_opt_in);

        if (!firstName || !lastName || !itemType) {
            return NextResponse.json(
                { error: "Name and item type are required." },
                { status: 400 },
            );
        }

        if (!phone && !email) {
            return NextResponse.json(
                { error: "Please provide a phone number or email so we can reach you." },
                { status: 400 },
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
                { status: 500 },
            );
        }

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: customer.id,
                intakeChannel: "web_lead",
                itemType,
                itemDescription: description || null,
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
        for (const photoUrl of photos.slice(0, 6)) {
            if (typeof photoUrl === "string" && photoUrl.startsWith("data:image/")) {
                await prisma.orderPhoto.create({
                    data: {
                        orderId: order.id,
                        url: photoUrl,
                        caption: "Uploaded by customer",
                    },
                });
            }
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                entityType: "order",
                entityId: order.id,
                orderId: order.id,
                action: "web_lead_submitted",
                metadata: { orderNumber, customerName: `${firstName} ${lastName}`, photoCount: photos.length },
            },
        });

        // Notify staff via email
        const emailResult = await sendNewWebLeadNotification({
            orderNumber,
            customerName: `${firstName} ${lastName}`,
            customerEmail: email || "N/A",
            customerPhone: phone || "N/A",
            itemType,
            description: description || "N/A",
            notes: notes || "N/A",
        });
        
        if (!emailResult.ok) {
            console.error("Failed to send web lead notification email:", emailResult.error);
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
            console.log("Web lead notification email sent successfully:", { orderNumber, to: "jake@westroxburyframing.com", cc: "frameguy1@hotmail.com" });
        }

        return NextResponse.json({
            ok: true,
            order_number: orderNumber,
        });
    } catch (error) {
        console.error("Error creating web lead order:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again or contact us directly." },
            { status: 500 },
        );
    }
}
