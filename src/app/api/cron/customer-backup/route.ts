import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

/**
 * GET /api/cron/customer-backup
 * Runs daily via Vercel Cron. Backs up the full customer list
 * to Vercel Blob storage.
 *
 * Secured by CRON_SECRET header check (set in Vercel env).
 */
export async function GET(req: Request) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zip: true,
        preferredContact: true,
        marketingOptIn: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, invoices: true } },
      },
    });

    const payload = {
      backupAt: new Date().toISOString(),
      type: "scheduled",
      count: customers.length,
      customers,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backups/customers/${timestamp}-auto.json`;

    const blob = await put(filename, JSON.stringify(payload, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    console.log(`[cron] Customer backup complete: ${customers.length} customers → ${blob.url}`);

    return NextResponse.json({
      ok: true,
      count: customers.length,
      url: blob.url,
    });
  } catch (error) {
    console.error("[cron] Customer backup failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
