/**
 * Manually run a full database backup right now and upload to Vercel Blob.
 * Mirrors the logic in /api/cron/full-backup so we can prove the dump works
 * before the cron's first scheduled run.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/run-full-backup-now.ts
 */

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing. Source .env.local first.");
  }

  console.log("Dumping all tables...");

  const customers = (await prisma.customer.findMany()).map((c) => ({
    ...c,
    hasAccount: !!c.passwordHash,
    passwordHash: undefined,
  }));
  const users = (await prisma.user.findMany()).map((u) => ({
    ...u,
    hasAccount: !!u.passwordHash,
    passwordHash: undefined,
  }));

  const [
    locations,
    vendors,
    vendorCatalogItems,
    priceCodes,
    customerTags,
    customerTagAssignments,
    leads,
    leadEmails,
    recallCampaigns,
    recallCampaignSends,
    products,
    inventoryItems,
    inventoryLots,
    purchaseOrders,
    purchaseOrderLines,
    orders,
    orderSpecs,
    orderPhotos,
    orderActivities,
    orderComponents,
    orderScenarios,
    invoices,
    invoicePayments,
    payments,
    appointments,
    giftCertificates,
    activityLogs,
    galleryItems,
    staffMessages,
  ] = await Promise.all([
    prisma.location.findMany(),
    prisma.vendor.findMany(),
    prisma.vendorCatalogItem.findMany(),
    prisma.priceCode.findMany(),
    prisma.customerTag.findMany(),
    prisma.customerTagAssignment.findMany(),
    prisma.lead.findMany(),
    prisma.leadEmail.findMany(),
    prisma.recallCampaign.findMany(),
    prisma.recallCampaignSend.findMany(),
    prisma.product.findMany(),
    prisma.inventoryItem.findMany(),
    prisma.inventoryLot.findMany(),
    prisma.purchaseOrder.findMany(),
    prisma.purchaseOrderLine.findMany(),
    prisma.order.findMany(),
    prisma.orderSpecs.findMany(),
    prisma.orderPhoto.findMany(),
    prisma.orderActivity.findMany(),
    prisma.orderComponent.findMany(),
    prisma.orderScenario.findMany(),
    prisma.invoice.findMany(),
    prisma.invoicePayment.findMany(),
    prisma.payment.findMany(),
    prisma.appointment.findMany(),
    prisma.giftCertificate.findMany(),
    prisma.activityLog.findMany(),
    prisma.galleryItem.findMany(),
    prisma.staffMessage.findMany(),
  ]);

  const tables: Record<string, unknown[]> = {
    Location: locations,
    User: users,
    Vendor: vendors,
    VendorCatalogItem: vendorCatalogItems,
    PriceCode: priceCodes,
    CustomerTag: customerTags,
    Customer: customers,
    Lead: leads,
    LeadEmail: leadEmails,
    RecallCampaign: recallCampaigns,
    Product: products,
    InventoryItem: inventoryItems,
    InventoryLot: inventoryLots,
    PurchaseOrder: purchaseOrders,
    PurchaseOrderLine: purchaseOrderLines,
    Order: orders,
    OrderSpecs: orderSpecs,
    OrderPhoto: orderPhotos,
    OrderActivity: orderActivities,
    OrderComponent: orderComponents,
    OrderScenario: orderScenarios,
    Invoice: invoices,
    InvoicePayment: invoicePayments,
    Payment: payments,
    Appointment: appointments,
    GiftCertificate: giftCertificates,
    CustomerTagAssignment: customerTagAssignments,
    RecallCampaignSend: recallCampaignSends,
    ActivityLog: activityLogs,
    GalleryItem: galleryItems,
    StaffMessage: staffMessages,
  };

  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(tables)) counts[name] = rows.length;

  const restoreOrder = [
    "Location", "User", "Vendor", "VendorCatalogItem", "PriceCode",
    "CustomerTag", "Customer", "Lead", "LeadEmail", "RecallCampaign",
    "Product", "InventoryItem", "InventoryLot", "PurchaseOrder", "PurchaseOrderLine",
    "Order", "OrderSpecs", "OrderPhoto", "OrderActivity", "OrderComponent", "OrderScenario",
    "Invoice", "InvoicePayment", "Payment", "Appointment", "GiftCertificate",
    "CustomerTagAssignment", "RecallCampaignSend", "ActivityLog", "GalleryItem", "StaffMessage",
  ];

  const payload = {
    backupAt: new Date().toISOString(),
    type: "manual",
    schemaVersion: "1",
    restoreOrder,
    counts,
    tables,
  };

  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backups/full/${timestamp}-manual.json`;

  console.log(`\nCounts per table:`);
  for (const name of restoreOrder) {
    console.log(`  ${name.padEnd(24)} ${counts[name]}`);
  }
  console.log(`\nTotal rows: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
  console.log(`Payload size: ${(body.length / 1024).toFixed(1)} KB`);

  console.log(`\nUploading to ${filename}...`);
  const blob = await put(filename, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });

  console.log(`Uploaded: ${blob.url}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
