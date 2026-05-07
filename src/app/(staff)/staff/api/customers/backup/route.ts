import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getStaffUserIdFromRequest } from "@/lib/staffRequest";

const BACKUP_PREFIX = "backups/customers/";

/**
 * POST /staff/api/customers/backup
 * Creates a backup of the customer list in Vercel Blob storage.
 * Returns the URL and metadata of the backup.
 */
export async function POST(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { orders: true, invoices: true, appointments: true } },
    },
  });

  const payload = {
    backupAt: new Date().toISOString(),
    count: customers.length,
    customers: customers.map((c) => ({
      ...c,
      hasAccount: !!c.passwordHash,
      passwordHash: undefined, // strip actual hash from backup
    })),
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${BACKUP_PREFIX}${timestamp}.json`;

  const blob = await put(filename, JSON.stringify(payload, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  return NextResponse.json({
    ok: true,
    backup: {
      url: blob.url,
      filename,
      customerCount: customers.length,
      createdAt: new Date().toISOString(),
    },
  });
}

/**
 * GET /staff/api/customers/backup
 * Lists existing backups from Vercel Blob.
 */
export async function GET(req: Request) {
  const userId = getStaffUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { blobs } = await list({ prefix: BACKUP_PREFIX });

    const backups = blobs
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ backups });
  } catch {
    return NextResponse.json({ backups: [], note: "Blob storage not configured or empty." });
  }
}
