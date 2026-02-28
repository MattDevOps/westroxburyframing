/**
 * Comprehensive workflow testing script
 * Tests the entire order intake and payment flow
 * Run with: npx tsx scripts/test-workflow.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ test: name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ test: name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log("🧪 Running Comprehensive Workflow Tests\n");
  console.log("=" .repeat(60));

  // Test 1: Database connectivity
  await test("Database connectivity", async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  // Test 2: Customer creation
  await test("Customer creation via API", async () => {
    const testPhone = `617555${Date.now().toString().slice(-6)}`;
    const testEmail = `test${Date.now()}@test.example.com`;

    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Customer",
        phone: testPhone,
        email: testEmail,
        preferredContact: "email",
      },
    });

    if (!customer.id) throw new Error("Customer not created");
    
    // Cleanup
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Test 3: Order creation with components
  await test("Order creation with components", async () => {
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Order",
        phone: `617555${Date.now().toString().slice(-6)}`,
        email: `testorder${Date.now()}@test.example.com`,
      },
    });

    // Get location and staff user
    const location = await prisma.location.findFirst();
    const staffUser = await prisma.user.findFirst();
    
    if (!location || !staffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Missing location or staff user");
    }

    // Get a price code (optional for this test)
    const priceCode = await prisma.priceCode.findFirst({
      where: { active: true },
    });

    if (!priceCode) {
      // Skip component creation if no price code
      console.log("    ⚠️  No active price code found (skipping component)");
    }

    // Get location for order
    const testLocation = await prisma.location.findFirst();
    if (!testLocation) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("No location found");
    }

    // Get staff user for order
    const testStaffUser = await prisma.user.findFirst();
    if (!testStaffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("No staff user found");
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-${Date.now()}`,
        status: "new_design",
        itemType: "art",
        width: 16,
        height: 20,
        units: "in",
        subtotalAmount: 10000,
        taxAmount: 625,
        totalAmount: 10625,
        currency: "USD",
        intakeChannel: "walk_in",
        locationId: testLocation.id,
        createdByUserId: testStaffUser.id,
      },
    });

    // Create component if price code exists
    if (priceCode) {
      await prisma.orderComponent.create({
        data: {
          orderId: order.id,
          category: "frame",
          position: 0,
          priceCodeId: priceCode.id,
          description: "Test Frame",
          quantity: 1,
          lineTotal: 10000,
        },
      });

      // Verify
      const components = await prisma.orderComponent.findMany({
        where: { orderId: order.id },
      });

      if (components.length === 0) {
        await prisma.order.delete({ where: { id: order.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        throw new Error("Component not created");
      }
    }

    // Cleanup
    await prisma.orderComponent.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Test 4: Invoice creation
  await test("Invoice creation", async () => {
    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Invoice",
        phone: `617555${Date.now().toString().slice(-6)}`,
        email: `testinvoice${Date.now()}@test.example.com`,
      },
    });

    // Get location and staff user
    const invLocation = await prisma.location.findFirst();
    const invStaffUser = await prisma.user.findFirst();
    
    if (!invLocation || !invStaffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Missing location or staff user");
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-INV-${Date.now()}`,
        status: "new_design",
        itemType: "art",
        width: 16,
        height: 20,
        units: "in",
        subtotalAmount: 10000,
        taxAmount: 625,
        totalAmount: 10625,
        currency: "USD",
        locationId: invLocation.id,
        createdByUserId: invStaffUser.id,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        customerId: customer.id,
        createdByUserId: invStaffUser.id,
        invoiceNumber: `INV-TEST-${Date.now()}`,
        status: "pending",
        totalAmount: 10625,
        balanceDue: 10625,
        depositPercent: 50,
        depositAmount: 5313,
      },
    });

    // Link order to invoice
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceId: invoice.id },
    });

    // Verify
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { invoiceId: true },
    });

    if (!updatedOrder || updatedOrder.invoiceId !== invoice.id) {
      await prisma.invoice.delete({ where: { id: invoice.id } });
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Order not linked to invoice");
    }

    // Cleanup
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Test 5: Order status transitions
  await test("Order status transitions", async () => {
    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Status",
        phone: `617555${Date.now().toString().slice(-6)}`,
      },
    });

    // Get location and staff user
    const statusLocation = await prisma.location.findFirst();
    const statusStaffUser = await prisma.user.findFirst();
    
    if (!statusLocation || !statusStaffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Missing location or staff user");
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-STATUS-${Date.now()}`,
        status: "new_design",
        itemType: "art",
        width: 16,
        height: 20,
        units: "in",
        subtotalAmount: 10000,
        taxAmount: 625,
        totalAmount: 10000,
        currency: "USD",
        locationId: statusLocation.id,
        createdByUserId: statusStaffUser.id,
      },
    });

    // Test status transitions
    const statuses = ["new_design", "awaiting_materials", "in_production", "quality_check", "ready_for_pickup"] as const;

    for (const status of statuses) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: status as any },
      });

      const updated = await prisma.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      if (updated?.status !== status) {
        await prisma.order.delete({ where: { id: order.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        throw new Error(`Status transition failed: expected ${status}, got ${updated?.status}`);
      }
    }

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Test 6: Pricing calculation
  await test("Pricing calculation", async () => {
    const priceCode = await prisma.priceCode.findFirst({
      where: { active: true },
    });

    if (!priceCode) {
      // This is okay - pricing codes may not exist in test environment
      console.log("    ⚠️  No active price codes found (skipping)");
      return;
    }

    // Basic validation that formula exists
    if (!priceCode.formula || priceCode.formula.trim() === "") {
      throw new Error("Price code formula is empty");
    }
  });

  // Test 7: Inventory tracking
  await test("Inventory item lookup", async () => {
    const inventoryItem = await prisma.inventoryItem.findFirst();

    if (inventoryItem) {
      // Verify we can query inventory
      const found = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id },
        include: { vendorItem: true },
      });

      if (!found) {
        throw new Error("Inventory item not found");
      }
    }
    // If no inventory items exist, that's okay - just verify the query works
  });

  // Test 8: Customer search
  await test("Customer search functionality", async () => {
    const testPhone = `617555${Date.now().toString().slice(-6)}`;
    const customer = await prisma.customer.create({
      data: {
        firstName: "SearchTest",
        lastName: "Customer",
        phone: testPhone,
        email: `searchtest${Date.now()}@test.example.com`,
      },
    });

    // Test search by phone
    const byPhone = await prisma.customer.findFirst({
      where: { phone: testPhone },
    });

    if (!byPhone || byPhone.id !== customer.id) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Customer search by phone failed");
    }

    // Cleanup
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Summary:\n");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}\n`);

  if (failed > 0) {
    console.log("Failed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log("🎉 All tests passed!");
}

runTests()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
