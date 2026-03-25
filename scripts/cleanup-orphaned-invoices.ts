/**
 * Cleanup orphaned invoices — pending invoices with no linked orders.
 * Run with: npx tsx scripts/cleanup-orphaned-invoices.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanedInvoices() {
  // Find pending invoices that have zero linked orders
  const orphanedInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["draft", "sent", "partial"] },
      orders: { none: {} },
    },
    include: {
      payments: { select: { id: true }, take: 1 },
      _count: { select: { orders: true } },
    },
  });

  if (orphanedInvoices.length === 0) {
    console.log("No orphaned pending invoices found.");
    return;
  }

  console.log(`Found ${orphanedInvoices.length} orphaned pending invoice(s):\n`);
  for (const inv of orphanedInvoices) {
    console.log(
      `  - ${inv.invoiceNumber} | status: ${inv.status} | total: $${(inv.totalAmount / 100).toFixed(2)} | balance: $${(inv.balanceDue / 100).toFixed(2)} | orders: ${inv._count.orders} | has payments: ${inv.payments.length > 0}`
    );
  }

  let deleted = 0;
  let voided = 0;

  for (const inv of orphanedInvoices) {
    try {
      if (inv.payments.length > 0) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: "void" },
        });
        voided++;
        console.log(`  Voided ${inv.invoiceNumber} (has payment history)`);
      } else {
        await prisma.invoicePayment.deleteMany({ where: { invoiceId: inv.id } });
        await prisma.invoice.delete({ where: { id: inv.id } });
        deleted++;
        console.log(`  Deleted ${inv.invoiceNumber}`);
      }
    } catch (error: any) {
      console.error(`  Failed to clean up ${inv.invoiceNumber}: ${error.message}`);
    }
  }

  console.log(`\nDone: ${deleted} deleted, ${voided} voided.`);
}

cleanupOrphanedInvoices()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
