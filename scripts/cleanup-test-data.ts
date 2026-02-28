/**
 * Script to find and delete test customers and their orders
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🔍 Searching for test customers and orders...\n");

  // Find test customers by email patterns (using Prisma string matching)
  const customersWithTestEmails = await prisma.customer.findMany({
    where: {
      OR: [
        { email: { contains: "@test.example.com", mode: "insensitive" } },
        { email: { contains: "@example.com", mode: "insensitive" } },
        { email: { contains: "test@", mode: "insensitive" } },
        { email: { startsWith: "test", mode: "insensitive" } },
        { email: { contains: ".test", mode: "insensitive" } },
      ],
    },
    include: {
      orders: {
        select: { id: true, orderNumber: true },
      },
      invoices: {
        select: { id: true, invoiceNumber: true },
      },
    },
  });

  // Find customers with test names
  const customersWithTestNames = await prisma.customer.findMany({
    where: {
      OR: [
        { firstName: { startsWith: "Test", mode: "insensitive" } },
        { lastName: { startsWith: "Test", mode: "insensitive" } },
        { firstName: { contains: "TestCustomer", mode: "insensitive" } },
        { lastName: { contains: "TestCustomer", mode: "insensitive" } },
        { firstName: { startsWith: "Dummy", mode: "insensitive" } },
        { firstName: { startsWith: "Fake", mode: "insensitive" } },
      ],
    },
    include: {
      orders: {
        select: { id: true, orderNumber: true },
      },
      invoices: {
        select: { id: true, invoiceNumber: true },
      },
    },
  });

  // Combine and deduplicate
  const allTestCustomers = new Map<string, typeof customersWithTestEmails[0]>();
  for (const customer of [...customersWithTestEmails, ...customersWithTestNames]) {
    allTestCustomers.set(customer.id, customer);
  }

  const testCustomers = Array.from(allTestCustomers.values());

  if (testCustomers.length === 0) {
    console.log("✅ No test customers found.");
    return;
  }

  console.log(`Found ${testCustomers.length} test customer(s):\n`);
  for (const customer of testCustomers) {
    console.log(`  - ${customer.firstName} ${customer.lastName}`);
    console.log(`    Email: ${customer.email || "N/A"}`);
    console.log(`    Phone: ${customer.phone || "N/A"}`);
    console.log(`    Orders: ${customer.orders.length}`);
    if (customer.orders.length > 0) {
      console.log(`    Order Numbers: ${customer.orders.map((o) => o.orderNumber).join(", ")}`);
    }
    console.log(`    Invoices: ${customer.invoices.length}`);
    if (customer.invoices.length > 0) {
      console.log(`    Invoice Numbers: ${customer.invoices.map((i) => i.invoiceNumber).join(", ")}`);
    }
    console.log("");
  }

  // Count total orders and invoices to delete
  const totalOrders = testCustomers.reduce((sum, c) => sum + c.orders.length, 0);
  const totalInvoices = testCustomers.reduce((sum, c) => sum + c.invoices.length, 0);

  console.log(`\n⚠️  This will delete:`);
  console.log(`  - ${testCustomers.length} customer(s)`);
  console.log(`  - ${totalOrders} order(s)`);
  console.log(`  - ${totalInvoices} invoice(s)`);
  console.log(`\nProceeding with deletion...\n`);

  // Delete invoices first (they may reference orders)
  let deletedInvoices = 0;
  for (const customer of testCustomers) {
    for (const invoice of customer.invoices) {
      try {
        // Delete invoice payments first
        await prisma.invoicePayment.deleteMany({
          where: { invoiceId: invoice.id },
        });

        // Update orders to remove invoice reference (set invoiceId to null)
        await prisma.order.updateMany({
          where: { invoiceId: invoice.id },
          data: { invoiceId: null },
        });

        // Delete the invoice
        await prisma.invoice.delete({
          where: { id: invoice.id },
        });

        deletedInvoices++;
        console.log(`  ✅ Deleted invoice ${invoice.invoiceNumber}`);
      } catch (error: any) {
        console.error(`  ❌ Failed to delete invoice ${invoice.invoiceNumber}: ${error.message}`);
      }
    }
  }

  // Delete orders (to avoid foreign key constraints)
  let deletedOrders = 0;
  for (const customer of testCustomers) {
    for (const order of customer.orders) {
      try {
        // Delete order components first
        await prisma.orderComponent.deleteMany({
          where: { orderId: order.id },
        });

        // Delete order scenarios
        await prisma.orderScenario.deleteMany({
          where: { orderId: order.id },
        });

        // Delete order photos
        await prisma.orderPhoto.deleteMany({
          where: { orderId: order.id },
        });

        // Delete order activity
        await prisma.orderActivity.deleteMany({
          where: { orderId: order.id },
        });

        // Delete order specs
        await prisma.orderSpecs.deleteMany({
          where: { orderId: order.id },
        });

        // Delete order payments
        await prisma.payment.deleteMany({
          where: { orderId: order.id },
        });

        // Delete activity logs
        await prisma.activityLog.deleteMany({
          where: { orderId: order.id },
        });

        // Delete the order
        await prisma.order.delete({
          where: { id: order.id },
        });

        deletedOrders++;
        console.log(`  ✅ Deleted order ${order.orderNumber}`);
      } catch (error: any) {
        console.error(`  ❌ Failed to delete order ${order.orderNumber}: ${error.message}`);
      }
    }
  }

  // Delete customers (only if they have no remaining orders/invoices)
  let deletedCustomers = 0;
  for (const customer of testCustomers) {
    try {
      // Check if customer still has orders or invoices (shouldn't after cleanup above, but double-check)
      const remainingOrders = await prisma.order.count({
        where: { customerId: customer.id },
      });
      const remainingInvoices = await prisma.invoice.count({
        where: { customerId: customer.id },
      });

      if (remainingOrders > 0 || remainingInvoices > 0) {
        console.log(`  ⚠️  Skipping customer ${customer.firstName} ${customer.lastName} - still has ${remainingOrders} orders and ${remainingInvoices} invoices`);
        continue;
      }

      // Delete customer tag assignments
      await prisma.customerTagAssignment.deleteMany({
        where: { customerId: customer.id },
      });

      // Delete appointments
      await prisma.appointment.deleteMany({
        where: { customerId: customer.id },
      });

      // Delete gift certificates
      await prisma.giftCertificate.deleteMany({
        where: { issuedToCustomerId: customer.id },
      });

      // Delete the customer
      await prisma.customer.delete({
        where: { id: customer.id },
      });

      deletedCustomers++;
      console.log(`  ✅ Deleted customer ${customer.firstName} ${customer.lastName}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to delete customer ${customer.firstName} ${customer.lastName}: ${error.message}`);
    }
  }

  console.log(`\n✅ Cleanup complete:`);
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
