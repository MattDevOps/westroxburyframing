/**
 * Script to find and delete specific test customers and their orders
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Specific test customers to delete (first names, case-insensitive)
const TEST_CUSTOMER_NAMES = [
  { firstName: "linda" },
  { firstName: "ty", lastName: "walker" },
  { firstName: "danielle" },
  { firstName: "daniellse" },
  { firstName: "mark" },
  { firstName: "brian" },
  { firstName: "julia" },
  { firstName: "tim" },
];

async function cleanupTestData() {
  console.log("Searching for test customers...\n");

  // Build OR conditions for each test customer
  const orConditions = TEST_CUSTOMER_NAMES.map((n) => {
    const condition: any = {
      firstName: { equals: n.firstName, mode: "insensitive" },
    };
    if (n.lastName) {
      condition.lastName = { equals: n.lastName, mode: "insensitive" };
    }
    return condition;
  });

  const testCustomers = await prisma.customer.findMany({
    where: { OR: orConditions },
    include: {
      orders: {
        select: { id: true, orderNumber: true },
      },
      invoices: {
        select: { id: true, invoiceNumber: true },
      },
    },
  });

  if (testCustomers.length === 0) {
    console.log("No test customers found.");
    return;
  }

  console.log(`Found ${testCustomers.length} test customer(s):\n`);
  for (const customer of testCustomers) {
    console.log(`  - ${customer.firstName} ${customer.lastName} (${customer.email || "no email"}) [${customer.id}]`);
    if (customer.orders.length > 0) {
      console.log(`    Orders: ${customer.orders.map((o) => o.orderNumber).join(", ")}`);
    }
    if (customer.invoices.length > 0) {
      console.log(`    Invoices: ${customer.invoices.map((i) => i.invoiceNumber).join(", ")}`);
    }
  }

  const totalOrders = testCustomers.reduce((sum, c) => sum + c.orders.length, 0);
  const totalInvoices = testCustomers.reduce((sum, c) => sum + c.invoices.length, 0);

  console.log(`\nWill delete: ${testCustomers.length} customer(s), ${totalOrders} order(s), ${totalInvoices} invoice(s)`);
  console.log("Proceeding with deletion...\n");

  // Delete invoices first
  let deletedInvoices = 0;
  for (const customer of testCustomers) {
    for (const invoice of customer.invoices) {
      try {
        await prisma.invoicePayment.deleteMany({ where: { invoiceId: invoice.id } });
        await prisma.order.updateMany({ where: { invoiceId: invoice.id }, data: { invoiceId: null } });
        await prisma.invoice.delete({ where: { id: invoice.id } });
        deletedInvoices++;
        console.log(`  Deleted invoice ${invoice.invoiceNumber}`);
      } catch (error: any) {
        console.error(`  Failed to delete invoice ${invoice.invoiceNumber}: ${error.message}`);
      }
    }
  }

  // Delete orders
  let deletedOrders = 0;
  for (const customer of testCustomers) {
    for (const order of customer.orders) {
      try {
        await prisma.orderComponent.deleteMany({ where: { orderId: order.id } });
        await prisma.orderScenario.deleteMany({ where: { orderId: order.id } });
        await prisma.orderPhoto.deleteMany({ where: { orderId: order.id } });
        await prisma.orderActivity.deleteMany({ where: { orderId: order.id } });
        await prisma.orderSpecs.deleteMany({ where: { orderId: order.id } });
        await prisma.payment.deleteMany({ where: { orderId: order.id } });
        await prisma.activityLog.deleteMany({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
        deletedOrders++;
        console.log(`  Deleted order ${order.orderNumber}`);
      } catch (error: any) {
        console.error(`  Failed to delete order ${order.orderNumber}: ${error.message}`);
      }
    }
  }

  // Delete customers
  let deletedCustomers = 0;
  for (const customer of testCustomers) {
    try {
      const remainingOrders = await prisma.order.count({ where: { customerId: customer.id } });
      const remainingInvoices = await prisma.invoice.count({ where: { customerId: customer.id } });

      if (remainingOrders > 0 || remainingInvoices > 0) {
        console.log(`  Skipping ${customer.firstName} ${customer.lastName} - still has ${remainingOrders} orders and ${remainingInvoices} invoices`);
        continue;
      }

      await prisma.customerTagAssignment.deleteMany({ where: { customerId: customer.id } });
      await prisma.appointment.deleteMany({ where: { customerId: customer.id } });
      await prisma.giftCertificate.deleteMany({ where: { issuedToCustomerId: customer.id } });
      await prisma.customer.delete({ where: { id: customer.id } });
      deletedCustomers++;
      console.log(`  Deleted customer ${customer.firstName} ${customer.lastName}`);
    } catch (error: any) {
      console.error(`  Failed to delete customer ${customer.firstName} ${customer.lastName}: ${error.message}`);
    }
  }

  console.log(`\nCleanup complete:`);
  console.log(`  - Deleted ${deletedCustomers} customer(s)`);
  console.log(`  - Deleted ${deletedOrders} order(s)`);
  console.log(`  - Deleted ${deletedInvoices} invoice(s)`);
}

cleanupTestData()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
