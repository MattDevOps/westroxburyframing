import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/webhooks/calendly
 * Handles Calendly webhook events (invitee.created, invitee.canceled).
 * Creates/updates Appointment records and links to existing Customers by email.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const event = body.event;
        const payload = body.payload;

        if (!event || !payload) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        if (event === "invitee.created") {
            const invitee = payload.invitee || {};
            const scheduledEvent = payload.event || {};

            const email = (invitee.email || "").toLowerCase().trim();
            const name = (invitee.name || "").trim();
            const startTime = scheduledEvent.start_time || scheduledEvent.start_time_pretty;
            const endTime = scheduledEvent.end_time || scheduledEvent.end_time_pretty;
            const eventType = scheduledEvent.event_type?.name || "Consultation";
            const calendlyUri = invitee.uri || payload.uri || null;
            const notes = invitee.text_reminder_number
                ? `Phone: ${invitee.text_reminder_number}`
                : null;

            // Try to find customer by email
            let customerId: string | null = null;
            if (email) {
                const customer = await prisma.customer.findFirst({
                    where: { email },
                    select: { id: true },
                });
                if (customer) customerId = customer.id;
            }

            await prisma.appointment.create({
                data: {
                    customerId,
                    scheduledAt: startTime ? new Date(startTime) : new Date(),
                    endAt: endTime ? new Date(endTime) : null,
                    type: eventType,
                    source: "calendly",
                    externalId: calendlyUri,
                    notes: notes || `Booked by ${name} (${email})`,
                    status: "scheduled",
                },
            });

            console.log(`[Calendly] Appointment created for ${name} (${email})`);
            return NextResponse.json({ ok: true });
        }

        if (event === "invitee.canceled") {
            const calendlyUri = body.payload?.invitee?.uri || body.payload?.uri;
            if (calendlyUri) {
                const existing = await prisma.appointment.findFirst({
                    where: { externalId: calendlyUri },
                });
                if (existing) {
                    await prisma.appointment.update({
                        where: { id: existing.id },
                        data: { status: "cancelled" },
                    });
                    console.log(`[Calendly] Appointment cancelled: ${calendlyUri}`);
                }
            }
            return NextResponse.json({ ok: true });
        }

        // Unhandled event type — acknowledge
        return NextResponse.json({ ok: true, ignored: event });
    } catch (error) {
        console.error("[Calendly webhook error]", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
