import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/ids";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const limiter = rateLimit({ limit: 20, windowSeconds: 600 }); // 20 per 10 min

/**
 * POST /api/public/customer-info
 * Public endpoint for customers to submit just their contact information
 * Useful for in-store iPad kiosks where customers can quickly enter their info
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
        const marketing = Boolean(body.marketing_opt_in);

        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: "First name and last name are required." },
                { status: 400 },
            );
        }

        if (!phone && !email) {
            return NextResponse.json(
                { error: "Please provide a phone number or email address." },
                { status: 400 },
            );
        }

        // Create or update customer
        const customerPhone = phone || `web-${Date.now()}`;
        const customer = await prisma.customer.upsert({
            where: { phone: customerPhone },
            create: {
                firstName,
                lastName,
                phone: customerPhone,
                email,
                preferredContact: email ? "email" : "call",
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

        return NextResponse.json({
            success: true,
            customer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
            },
            message: "Your information has been saved successfully.",
        });
    } catch (error: any) {
        console.error("Error saving customer info:", error);
        return NextResponse.json(
            { error: "Unable to save your information. Please try again or contact us directly." },
            { status: 500 },
        );
    }
}
