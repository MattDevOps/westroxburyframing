/**
 * Script to find and delete test customers and their orders
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🔍 Searching for test customers and orders...\n");

  // Find test customers by email patterns
  const testEmailPatterns = [
    /test.*@.*\.(com|test|example)/i,
    /.*@.*\.test$/i,
    /.*@example\.com$/i,
    /test\d+@/i,
    /e2e\.test/i,
  ];

  // Find test customers by name patterns
  const testNamePatterns = [
    /^Test/i,
    /TestCustomer/i,
    /TestFirst/i,
    /TestLast/i,
    /^Dummy/i,
    /^Fake/i,
  ];

  // Find customers with test emails
  const customersWithTestEmails = await prisma.customer.findMany({
    where: {
      OR: [
        ...testEmailPatterns.map((pattern) => ({
          email: {
            contains: pattern.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            mode: "insensitive" as const,
          },
        })),
      ],
    },
    include: {
      orders: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  // Find customers with test names
  const customersWithTestNames = await prisma.customer.findMany({
    where: {
      OR: [
        ...testNamePatterns.map((pattern) => ({
          firstName: {
            contains: pattern.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            mode: "insensitive" as const,
          },
        })),
        ...testNamePatterns.map((pattern) => ({
          lastName: {
            contains: pattern.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            mode: "insensitive" as const,
          },
        })),
      ],
    },
    include: {
      orders: {
        select: { id: true, orderNumber: true },
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
    console.log("");
  }

  // Count total orders to delete
  const totalOrders = testCustomers.reduce((sum, c) => sum + c.orders.length, 0);

  console.log(`\n⚠️  This will delete:`);
  console.log(`  - ${testCustomers.length} customer(s)`);
  console.log(`  - ${totalOrders} order(s)`);
  console.log(`\nProceeding with deletion...\n`);

  // Delete orders first (to avoid foreign key constraints)
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

  // Delete customers
  let deletedCustomers = 0;
  for (const customer of testCustomers) {
    try {
      // Delete customer tag assignments
      await prisma.customerTagAssignment.deleteMany({
        where: { customerId: customer.id },
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
}

cleanupTestData()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
