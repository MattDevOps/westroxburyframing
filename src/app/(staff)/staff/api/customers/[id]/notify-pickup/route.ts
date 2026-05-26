import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendPickupReminderSMS, sendSMS } from "@/lib/sms";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const userId = getStaffUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    if (!customer.phone) {
      return NextResponse.json(
        { error: "Customer has no phone number on file." },
        { status: 400 }
      );
    }

    // Optional custom message overrides the canned pickup reminder.
    const body = await req.json().catch(() => ({}));
    const customMessage = typeof body?.message === "string" ? body.message.trim() : "";

    const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";

    const smsResult = customMessage
      ? await sendSMS({ to: customer.phone, message: customMessage })
      : await sendPickupReminderSMS({
          to: customer.phone,
          orderNumber: "",
          customerName,
        });

    try {
      await prisma.activityLog.create({
        data: {
          entityType: "customer",
          entityId: customer.id,
          action: smsResult.ok
            ? customMessage ? "custom_sms_sent" : "pickup_sms_sent"
            : customMessage ? "custom_sms_failed" : "pickup_sms_failed",
          actorUserId: userId,
          metadata: {
            phone: customer.phone,
            messageSid: smsResult.messageSid || null,
            error: smsResult.error || null,
            custom: customMessage ? true : false,
          } as any,
        },
      });
    } catch (logErr) {
      console.error("notify-pickup: activity log write failed", logErr);
    }

    if (!smsResult.ok) {
      return NextResponse.json(
        { error: smsResult.error || "Failed to send pickup SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      phone: customer.phone,
      messageSid: smsResult.messageSid,
    });
  } catch (err: any) {
    console.error("notify-pickup route crashed:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error sending pickup SMS" },
      { status: 500 }
    );
  }
}
