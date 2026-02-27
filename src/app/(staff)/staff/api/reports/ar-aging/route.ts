import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

/**
 * GET /staff/api/reports/ar-aging
 * A/R Aging Report - outstanding invoices grouped by age bucket
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all outstanding invoices (balanceDue > 0, not paid/void/cancelled)
    const invoices = await prisma.invoice.findMany({
      where: {
        balanceDue: { gt: 0 },
        status: { notIn: ["paid", "void", "cancelled"] },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paidAt: true,
          },
          orderBy: { paidAt: "desc" },
          take: 1, // Get most recent payment for last payment date
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    // Calculate aging for each invoice
    const invoicesWithAging = invoices.map((invoice) => {
      // Age based on invoice creation date (or last payment date if there was a payment)
      const ageFromDate = invoice.payments.length > 0 
        ? invoice.payments[0].paidAt 
        : invoice.createdAt;
      
      const daysOld = Math.floor(
        (now.getTime() - ageFromDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine aging bucket
      let agingBucket: string;
      if (daysOld <= 30) {
        agingBucket = "0-30 days";
      } else if (daysOld <= 60) {
        agingBucket = "31-60 days";
      } else if (daysOld <= 90) {
        agingBucket = "61-90 days";
      } else {
        agingBucket = "90+ days";
      }

      return {
        ...invoice,
        daysOld,
        agingBucket,
        lastPaymentDate: invoice.payments.length > 0 ? invoice.payments[0].paidAt : null,
      };
    });

    // Group by aging bucket
    const grouped: Record<string, typeof invoicesWithAging> = {};
    for (const invoice of invoicesWithAging) {
      if (!grouped[invoice.agingBucket]) {
        grouped[invoice.agingBucket] = [];
      }
      grouped[invoice.agingBucket].push(invoice);
    }

    // Calculate summary stats
    const totalOutstanding = invoicesWithAging.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const avgDaysOld =
      invoicesWithAging.length > 0
        ? invoicesWithAging.reduce((sum, inv) => sum + inv.daysOld, 0) / invoicesWithAging.length
        : 0;
    const oldestDays = invoicesWithAging.length > 0
      ? Math.max(...invoicesWithAging.map((inv) => inv.daysOld))
      : 0;

    // Format grouped data
    const buckets = [
      "0-30 days",
      "31-60 days",
      "61-90 days",
      "90+ days",
    ].map((bucket) => {
      const bucketInvoices = grouped[bucket] || [];
      return {
        bucket,
        count: bucketInvoices.length,
        totalBalance: bucketInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
        invoices: bucketInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: `${inv.customer.firstName} ${inv.customer.lastName}`,
          customerEmail: inv.customer.email,
          customerPhone: inv.customer.phone,
          totalAmount: inv.totalAmount,
          balanceDue: inv.balanceDue,
          status: inv.status,
          daysOld: inv.daysOld,
          createdAt: inv.createdAt.toISOString(),
          lastPaymentDate: inv.lastPaymentDate?.toISOString() || null,
          orderNumbers: inv.orders.map((o) => o.orderNumber).join(", "),
        })),
      };
    });

    return NextResponse.json({
      summary: {
        totalInvoices: invoices.length,
        totalOutstanding,
        avgDaysOld: Math.round(avgDaysOld),
        oldestDays,
      },
      buckets,
    });
  } catch (error: any) {
    console.error("Error generating A/R aging report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate A/R aging report" },
      { status: 500 }
    );
  }
}
