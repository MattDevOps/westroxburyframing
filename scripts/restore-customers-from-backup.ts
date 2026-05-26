/**
 * Restore customers from a Vercel Blob JSON backup created by
 * /api/cron/customer-backup or /staff/api/customers/backup.
 *
 * Usage:
 *   npx tsx scripts/restore-customers-from-backup.ts <backup-url>            # dry-run (no writes)
 *   npx tsx scripts/restore-customers-from-backup.ts <backup-url> --apply    # actually insert
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type BackupCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preferredContact: string;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
};

async function main() {
  const url = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!url) {
    console.error("Usage: tsx restore-customers-from-backup.ts <backup-url> [--apply]");
    process.exit(1);
  }

  console.log(`Fetching backup: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch backup: ${res.status}`);
  const payload = await res.json() as { backupAt: string; count: number; customers: BackupCustomer[] };

  console.log(`Backup taken at: ${payload.backupAt}`);
  console.log(`Backup contains: ${payload.count} customers\n`);

  const existing = await prisma.customer.findMany({
    select: { id: true, email: true, phone: true },
  });
  const existingIds = new Set(existing.map((c) => c.id));
  const existingEmails = new Set(existing.filter((c) => c.email).map((c) => c.email!.toLowerCase()));
  const existingPhones = new Set(existing.filter((c) => c.phone).map((c) => c.phone!));

  console.log(`Current DB has ${existing.length} customers.`);

  const toInsert: BackupCustomer[] = [];
  const skippedReason: Record<string, string[]> = { id: [], email: [], phone: [] };

  for (const c of payload.customers) {
    if (existingIds.has(c.id)) {
      skippedReason.id.push(`${c.firstName} ${c.lastName} (${c.id})`);
      continue;
    }
    if (c.email && existingEmails.has(c.email.toLowerCase())) {
      skippedReason.email.push(`${c.firstName} ${c.lastName} (${c.email})`);
      continue;
    }
    if (c.phone && existingPhones.has(c.phone)) {
      skippedReason.phone.push(`${c.firstName} ${c.lastName} (${c.phone})`);
      continue;
    }
    toInsert.push(c);
  }

  console.log(`Will insert: ${toInsert.length}`);
  console.log(`Skipped (id collision): ${skippedReason.id.length}`);
  console.log(`Skipped (email collision): ${skippedReason.email.length}`);
  console.log(`Skipped (phone collision): ${skippedReason.phone.length}`);

  for (const reason of ["id", "email", "phone"] as const) {
    if (skippedReason[reason].length > 0) {
      console.log(`\n  Skipped due to ${reason}:`);
      for (const s of skippedReason[reason]) console.log(`    - ${s}`);
    }
  }

  if (!apply) {
    console.log("\n[DRY RUN] Pass --apply to write to the database.");
    return;
  }

  console.log(`\nInserting ${toInsert.length} customers...`);

  const data: Prisma.CustomerCreateManyInput[] = toInsert.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email,
    addressLine1: c.addressLine1,
    addressLine2: c.addressLine2,
    city: c.city,
    state: c.state,
    zip: c.zip,
    preferredContact: c.preferredContact,
    marketingOptIn: c.marketingOptIn,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));

  const result = await prisma.customer.createMany({
    data,
    skipDuplicates: true,
  });

  const finalCount = await prisma.customer.count();
  console.log(`Inserted: ${result.count}`);
  console.log(`Customer table now has ${finalCount} rows.`);
}

main()
  .catch((e) => {
    console.error("Restore failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
