/**
 * Restore from a full-backup JSON file (produced by /api/cron/full-backup
 * or scripts/run-full-backup-now.ts).
 *
 * Usage:
 *   npx tsx scripts/restore-from-full-backup.ts <backup-url-or-path>                    # dry-run
 *   npx tsx scripts/restore-from-full-backup.ts <backup-url-or-path> --apply            # apply
 *   npx tsx scripts/restore-from-full-backup.ts <backup-url-or-path> --apply --only=Order,Invoice
 *
 * Behavior:
 *   - Inserts rows in restoreOrder (respects FK constraints).
 *   - Uses createMany({ skipDuplicates: true }) so rerunning is safe.
 *   - passwordHash is NOT in the backup (security); users with hasAccount=true
 *     will need to reset their password after restore.
 *   - --only=Name1,Name2 restricts to a subset of tables.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();

const PRISMA_DELEGATE_BY_TABLE: Record<string, () => any> = {
  Location: () => prisma.location,
  User: () => prisma.user,
  Vendor: () => prisma.vendor,
  VendorCatalogItem: () => prisma.vendorCatalogItem,
  PriceCode: () => prisma.priceCode,
  CustomerTag: () => prisma.customerTag,
  Customer: () => prisma.customer,
  Lead: () => prisma.lead,
  LeadEmail: () => prisma.leadEmail,
  RecallCampaign: () => prisma.recallCampaign,
  Product: () => prisma.product,
  InventoryItem: () => prisma.inventoryItem,
  InventoryLot: () => prisma.inventoryLot,
  PurchaseOrder: () => prisma.purchaseOrder,
  PurchaseOrderLine: () => prisma.purchaseOrderLine,
  Order: () => prisma.order,
  OrderSpecs: () => prisma.orderSpecs,
  OrderPhoto: () => prisma.orderPhoto,
  OrderActivity: () => prisma.orderActivity,
  OrderComponent: () => prisma.orderComponent,
  OrderScenario: () => prisma.orderScenario,
  Invoice: () => prisma.invoice,
  InvoicePayment: () => prisma.invoicePayment,
  Payment: () => prisma.payment,
  Appointment: () => prisma.appointment,
  GiftCertificate: () => prisma.giftCertificate,
  CustomerTagAssignment: () => prisma.customerTagAssignment,
  RecallCampaignSend: () => prisma.recallCampaignSend,
  ActivityLog: () => prisma.activityLog,
  GalleryItem: () => prisma.galleryItem,
  StaffMessage: () => prisma.staffMessage,
};

const DATE_FIELD_RE = /(At|Date|On)$|^createdAt$|^updatedAt$/;

function reviveDates<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const out: any = Array.isArray(row) ? [] : {};
  for (const [k, v] of Object.entries(row as any)) {
    if (typeof v === "string" && DATE_FIELD_RE.test(k) && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stripBackupOnlyFields(table: string, row: any): any {
  const out = { ...row };
  delete out.hasAccount; // synthetic field only in backups
  delete out._count;
  return out;
}

async function loadBackup(source: string): Promise<any> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch ${source}: ${res.status}`);
    return await res.json();
  }
  return JSON.parse(readFileSync(source, "utf-8"));
}

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error("Usage: tsx restore-from-full-backup.ts <url-or-path> [--apply] [--only=Table1,Table2]");
    process.exit(1);
  }
  const apply = process.argv.includes("--apply");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

  console.log(`Loading backup: ${source}`);
  const payload = await loadBackup(source);
  console.log(`Backup taken: ${payload.backupAt}  (type: ${payload.type})`);
  const order: string[] = payload.restoreOrder ?? Object.keys(payload.tables);

  let plannedInserts = 0;
  const plan: { table: string; rows: number }[] = [];

  for (const table of order) {
    if (only && !only.has(table)) continue;
    const rows = (payload.tables?.[table] ?? []) as any[];
    if (rows.length === 0) continue;
    plan.push({ table, rows: rows.length });
    plannedInserts += rows.length;
  }

  console.log(`\nPlanned restore (${plannedInserts} total rows):`);
  for (const p of plan) console.log(`  ${p.table.padEnd(24)} ${p.rows}`);

  if (!apply) {
    console.log("\n[DRY RUN] Pass --apply to write to the database.");
    return;
  }

  console.log("\nApplying restore...");
  const results: { table: string; inserted: number; attempted: number }[] = [];
  for (const { table, rows } of plan) {
    const delegate = PRISMA_DELEGATE_BY_TABLE[table];
    if (!delegate) {
      console.warn(`  Skipping unknown table: ${table}`);
      continue;
    }
    const allRows = (payload.tables[table] as any[]).map((r) => reviveDates(stripBackupOnlyFields(table, r)));
    try {
      const res = await delegate().createMany({ data: allRows, skipDuplicates: true });
      results.push({ table, inserted: res.count, attempted: allRows.length });
      console.log(`  ${table.padEnd(24)} inserted ${res.count} / attempted ${allRows.length}`);
    } catch (e: any) {
      console.error(`  ${table.padEnd(24)} FAILED: ${e.message}`);
      results.push({ table, inserted: 0, attempted: allRows.length });
    }
  }

  console.log("\nRestore summary:");
  for (const r of results) {
    console.log(`  ${r.table.padEnd(24)} ${r.inserted} / ${r.attempted}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
