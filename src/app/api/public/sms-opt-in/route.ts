import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone, normalizeEmail } from "@/lib/ids";

/**
 * POST /api/public/sms-opt-in
 * Public endpoint for customers to opt in to SMS/text messaging
 * This page URL can be provided to Twilio as proof of consent
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body.phone ? normalizePhone(String(body.phone)) : null;
    const email = body.email ? normalizeEmail(body.email) : null;

    if (!phone && !email) {
      return NextResponse.json(
        { error: "Phone number or email address is required." },
        { status: 400 }
      );
    }

    // Find customer by phone or email
    let customer = null;
    if (phone) {
      customer = await prisma.customer.findFirst({
        where: { phone },
      });
    }
    if (!customer && email) {
      customer = await prisma.customer.findFirst({
        where: { email },
      });
    }

    if (customer) {
      // Update existing customer
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          smsOptIn: true,
          smsOptInAt: new Date(),
          // Update phone/email if provided and not already set
          phone: phone && !customer.phone ? phone : undefined,
          email: email && !customer.email ? email : undefined,
        },
      });
    } else {
      // Create new customer record for opt-in
      // We need at least a name, so we'll use placeholder values
      const firstName = phone ? "SMS" : "Customer";
      const lastName = "Opt-In";
      
      await prisma.customer.create({
        data: {
          firstName,
          lastName,
          phone: phone || null,
          email: email || null,
          smsOptIn: true,
          smsOptInAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully opted in to SMS messages.",
    });
  } catch (error: any) {
    console.error("SMS opt-in error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process opt-in request." },
      { status: 500 }
    );
  }
}
