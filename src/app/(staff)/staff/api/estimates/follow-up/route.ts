import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { sendEstimateFollowUpEmail } from "@/lib/email";

// Type assertion to work around TypeScript cache issue with Prisma client
const prismaWithActivity: any = prisma;

export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { daysOld = 7 } = body;

  // Find estimates that are at least X days old and haven't been converted
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const estimates = await prisma.order.findMany({
    where: {
      status: "estimate",
      createdAt: { lte: cutoffDate },
      customer: {
        email: { not: null },
      },
    },
    include: {
      customer: true,
    },
  });

  const baseUrl = process.env.PUBLIC_BASE_URL || "https://westroxburyframing.com";
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const estimate of estimates) {
    if (!estimate.customer.email) continue;

    const customerName = `${estimate.customer.firstName || ""} ${estimate.customer.lastName || ""}`.trim() || "Customer";
    const estimatedTotal = estimate.totalAmount > 0 ? `$${(estimate.totalAmount / 100).toFixed(2)}` : "TBD";

    const result = await sendEstimateFollowUpEmail({
      to: estimate.customer.email,
      orderNumber: estimate.orderNumber,
      customerName,
      estimatedTotal,
      estimateUrl: `${baseUrl}/staff/orders/${estimate.id}`,
    });

    if (result.ok) {
      results.sent++;
      
      // Log activity
      await prismaWithActivity.orderActivity.create({
        data: {
          orderId: estimate.id,
          type: "email_sent",
          message: `Estimate follow-up email sent to ${estimate.customer.email}`,
          createdByUserId: userId,
        },
      });
    } else {
      results.failed++;
      results.errors.push(`${estimate.orderNumber}: ${result.error || "Failed"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    total: estimates.length,
    sent: results.sent,
    failed: results.failed,
    errors: results.errors.slice(0, 10),
  });
}
