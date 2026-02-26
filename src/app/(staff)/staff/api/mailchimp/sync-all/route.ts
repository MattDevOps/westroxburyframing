import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";
import { syncMailchimpCustomer } from "@/lib/mailchimp";

/**
 * POST /staff/api/mailchimp/sync-all
 * Sync all opted-in customers to Mailchimp
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all customers who have opted in and have email
    const customers = await prisma.customer.findMany({
      where: {
        marketingOptIn: true,
        email: { not: null },
      },
      include: {
        tagAssignments: {
          include: {
            tag: true,
          },
        },
      },
    });

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync each customer
    for (const customer of customers) {
      try {
        await syncMailchimpCustomer(customer);
        synced++;
      } catch (error: any) {
        failed++;
        const errorMsg = `${customer.email || customer.id}: ${error.message || "Failed to sync"}`;
        errors.push(errorMsg);
        console.error("Mailchimp sync error:", errorMsg);
      }
    }

    return NextResponse.json({
      ok: true,
      synced,
      failed,
      total: customers.length,
      errors: errors.slice(0, 20), // Limit errors returned
    });
  } catch (error: any) {
    console.error("Error syncing all customers to Mailchimp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync customers" },
      { status: 500 }
    );
  }
}
