import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReadyForPickupEmail } from "@/lib/email";

/**
 * GET /api/cron/pickup-reminders
 * Called daily by Vercel Cron. Sends pickup reminder emails to customers whose
 * orders have been in "ready_for_pickup" for >= 3 days and haven't had a
 * reminder in the past 3 days.
 */
export async function GET(request: Request) {
  // Verify cron secret (Vercel sets CRON_SECRET header automatically)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  try {
    // Find orders that have been ready_for_pickup for at least 3 days
    const readyOrders = await prisma.order.findMany({
      where: {
        status: "ready_for_pickup",
        updatedAt: { lt: threeDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const order of readyOrders) {
      if (!order.customer?.email) {
        skipped++;
        continue;
      }

      // Check if we already sent a reminder in the past 3 days
      const recentReminder = await (prisma as any).orderActivity.findFirst({
        where: {
          orderId: order.id,
          type: "email_sent",
          message: { contains: "Pickup reminder" },
          createdAt: { gte: threeDaysAgo },
        },
      });

      if (recentReminder) {
        skipped++;
        continue;
      }

      // Send the reminder
      const emailResult = await sendReadyForPickupEmail({
        to: order.customer.email,
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      });

      if (emailResult.ok) {
        sent++;
        await (prisma as any).orderActivity.create({
          data: {
            orderId: order.id,
            type: "email_sent",
            message: `Pickup reminder email sent (auto) to ${order.customer.email}`,
          },
        });
      } else {
        errors.push(`Order ${order.orderNumber}: ${emailResult.error}`);
      }
    }

    console.log(
      `[CRON] Pickup reminders: ${sent} sent, ${skipped} skipped, ${errors.length} errors`
    );

    return NextResponse.json({
      ok: true,
      totalReady: readyOrders.length,
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[CRON] Pickup reminders error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
