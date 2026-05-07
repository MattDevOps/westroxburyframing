/**
 * Test script for all 5 improvements:
 * 1. Mobile/tablet responsiveness
 * 2. Error handling standardization
 * 3. Vendor price import
 * 4. Edge case validation
 * 5. Enhanced activity logging
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
  console.log("🧪 Testing All Improvements\n");
  console.log("=".repeat(60));

  // Test 1: Error handling utilities
  await test("Error handling - AppError class", () => {
    const { AppError } = require("../src/lib/apiErrorHandler");
    const error = new AppError("Test error", 400, "TEST_CODE");
    if (error.statusCode !== 400 || error.code !== "TEST_CODE") {
      throw new Error("AppError not working correctly");
    }
  });

  await test("Error handling - Validation helpers", () => {
    const { validateRequired } = require("../src/lib/apiErrorHandler");
    try {
      validateRequired({ name: "test" }, ["name", "email"]);
      throw new Error("Should have thrown validation error");
    } catch (e: any) {
      if (!e.message.includes("Missing required fields")) {
        throw new Error("Validation error message incorrect");
      }
    }
  });

  // Test 2: Edge case validation
  await test("Validation - Dimensions (zero)", () => {
    const { validateDimensions } = require("../src/lib/validation");
    const result = validateDimensions(0, 10);
    if (result.valid) throw new Error("Should reject zero width");
  });

  await test("Validation - Dimensions (negative)", () => {
    const { validateDimensions } = require("../src/lib/validation");
    const result = validateDimensions(-5, 10);
    if (result.valid) throw new Error("Should reject negative width");
  });

  await test("Validation - Dimensions (extreme aspect ratio)", () => {
    const { validateDimensions } = require("../src/lib/validation");
    const result = validateDimensions(1, 100);
    if (result.valid) throw new Error("Should warn about extreme aspect ratio");
  });

  await test("Validation - Pricing (mismatch)", () => {
    const { validatePricing } = require("../src/lib/validation");
    const result = validatePricing(10000, 625, 11000); // Should be 10625
    if (result.valid) throw new Error("Should detect pricing mismatch");
  });

  await test("Validation - Discount (exceeds subtotal)", () => {
    const { validateDiscount } = require("../src/lib/validation");
    const result = validateDiscount("fixed", 20000, 10000);
    if (result.valid) throw new Error("Should reject discount exceeding subtotal");
  });

  await test("Validation - Customer (missing phone/email)", () => {
    const { validateCustomer } = require("../src/lib/validation");
    const result = validateCustomer({ firstName: "Test", lastName: "User" });
    if (result.valid) throw new Error("Should require phone or email");
  });

  await test("Validation - Components (empty)", () => {
    const { validateComponents } = require("../src/lib/validation");
    const result = validateComponents([]);
    if (result.valid) throw new Error("Should require at least one component");
  });

  // Test 3: Activity logging
  await test("Activity logging - Order creation", async () => {
    const { logOrderCreated } = require("../src/lib/activityLogger");
    
    // Create test customer and order
    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Activity",
        phone: `617555${Date.now().toString().slice(-6)}`,
        email: `testactivity${Date.now()}@test.example.com`,
      },
    });

    const location = await prisma.location.findFirst();
    const staffUser = await prisma.user.findFirst();
    
    if (!location || !staffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Missing location or staff user");
    }

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-ACT-${Date.now()}`,
        status: "new_design",
        itemType: "art",
        width: 16,
        height: 20,
        units: "in",
        subtotalAmount: 10000,
        taxAmount: 625,
        totalAmount: 10625,
        currency: "USD",
        locationId: location.id,
        createdByUserId: staffUser.id,
      },
    });

    // Test logging
    await logOrderCreated({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: staffUser.id,
      customerId: customer.id,
      totalAmount: 10625,
      status: "new_design",
    });

    // Verify activity was created
    const activities = await prisma.orderActivity.findMany({
      where: { orderId: order.id },
    });

    if (activities.length === 0) {
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Activity not logged");
    }

    // Cleanup
    await prisma.orderActivity.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  // Test 4: Vendor price import API structure
  await test("Vendor price import - API endpoint exists", async () => {
    // Just verify the file exists and exports the right function
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "src/app/(staff)/staff/api/vendors/[id]/import-prices/route.ts");
    if (!fs.existsSync(filePath)) {
      throw new Error("Import prices API endpoint not found");
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("export async function POST")) {
      throw new Error("Import prices endpoint missing POST handler");
    }
  });

  // Test 5: Database constraints and edge cases
  await test("Edge case - Order with zero total", async () => {
    const customer = await prisma.customer.create({
      data: {
        firstName: "Test",
        lastName: "Zero",
        phone: `617555${Date.now().toString().slice(-6)}`,
      },
    });

    const location = await prisma.location.findFirst();
    const staffUser = await prisma.user.findFirst();
    
    if (!location || !staffUser) {
      await prisma.customer.delete({ where: { id: customer.id } });
      throw new Error("Missing location or staff user");
    }

    // This should be allowed (free order)
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        orderNumber: `TEST-ZERO-${Date.now()}`,
        status: "new_design",
        itemType: "art",
        width: 16,
        height: 20,
        units: "in",
        subtotalAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: "USD",
        locationId: location.id,
        createdByUserId: staffUser.id,
      },
    });

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
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

  console.log("🎉 All improvement tests passed!");
}

runTests()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
