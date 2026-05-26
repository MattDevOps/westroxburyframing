import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

/**
 * GET /api/cron/full-backup
 *
 * Daily comprehensive backup of every business-data table, every column.
 * Writes ONE JSON file per day to Vercel Blob at
 *   backups/full/<timestamp>-auto.json
 *
 * Includes every scalar column. Sensitive fields (passwordHash on Customer
 * and User) are stripped at serialization but replaced with a `hasAccount`
 * boolean so restore knows the account existed.
 *
 * Restore order respects FK dependencies (see RESTORE_ORDER below).
 *
 * Secured by CRON_SECRET header check. Set CRON_SECRET in Vercel env.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tables = await dumpAllTables();
    const counts: Record<string, number> = {};
    for (const [name, rows] of Object.entries(tables)) counts[name] = rows.length;

    const payload = {
      backupAt: new Date().toISOString(),
      type: "scheduled",
      schemaVersion: "1",
      restoreOrder: RESTORE_ORDER,
      counts,
      tables,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backups/full/${timestamp}-auto.json`;

    const blob = await put(filename, JSON.stringify(payload), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });

    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`[cron] Full backup complete: ${totalRows} rows across ${Object.keys(counts).length} tables → ${blob.url}`);

    return NextResponse.json({ ok: true, url: blob.url, counts, totalRows });
  } catch (error) {
    console.error("[cron] Full backup failed:", error);
    return NextResponse.json({ error: "Backup failed", detail: String(error) }, { status: 500 });
  }
}

/** Order in which tables must be restored to satisfy FK constraints. */
const RESTORE_ORDER = [
  "Location",
  "User",
  "Vendor",
  "VendorCatalogItem",
  "PriceCode",
  "CustomerTag",
  "Customer",
  "Lead",
  "LeadEmail",
  "RecallCampaign",
  "Product",
  "InventoryItem",
  "InventoryLot",
  "PurchaseOrder",
  "PurchaseOrderLine",
  "Order",
  "OrderSpecs",
  "OrderPhoto",
  "OrderActivity",
  "OrderComponent",
  "OrderScenario",
  "Invoice",
  "InvoicePayment",
  "Payment",
  "Appointment",
  "GiftCertificate",
  "CustomerTagAssignment",
  "RecallCampaignSend",
  "ActivityLog",
  "GalleryItem",
  "StaffMessage",
];

async function dumpAllTables(): Promise<Record<string, unknown[]>> {
  // Customer/User passwordHash is omitted; hasAccount flag preserved.
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

  return {
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
}
