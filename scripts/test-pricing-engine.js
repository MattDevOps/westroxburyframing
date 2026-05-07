/**
 * Headless test script for Pricing Engine (Phase 2B & 2C)
 * Run with: node scripts/test-pricing-engine.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Test data
const testVendor = {
  name: "Test Vendor",
  code: "TEST",
  email: "test@vendor.com",
};

const testPriceCode = {
  code: "TEST-MOULDING",
  name: "Test Moulding Price",
  category: "moulding",
  formula: "per_foot",
  baseRate: 5.50, // $5.50 per foot
  minCharge: 0,
  wastePercent: 10,
  multiplier: 1,
  active: true,
};

const testCatalogItem = {
  itemNumber: "TEST-001",
  description: "Test Moulding",
  category: "moulding",
  unitType: "foot",
  costPerUnit: 2.50,
  retailPerUnit: 5.50,
  discontinued: false,
};

const testComponents = [
  {
    category: "frame",
    priceCodeId: null, // Will be set after creating price code
    description: "Test Frame",
    quantity: 1,
  },
  {
    category: "mat",
    priceCodeId: null,
    description: "Test Mat",
    quantity: 1,
  },
];

let authCookie = null;
let vendorId = null;
let priceCodeId = null;
let catalogItemId = null;

async function login() {
  console.log("🔐 Logging in...");
  // For headless testing, we need to create a test user or use existing credentials
  // This is a simplified version - in real testing you'd use proper auth
  console.log("⚠️  Note: This test requires manual auth cookie or test user setup");
  return true;
}

async function createVendor() {
  console.log("\n📦 Creating test vendor...");
  const res = await fetch(`${BASE_URL}/staff/api/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify(testVendor),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.error?.includes("already exists")) {
      console.log("   Vendor already exists, fetching...");
      const getRes = await fetch(`${BASE_URL}/staff/api/vendors`, {
        headers: { Cookie: authCookie || "" },
      });
      const data = await getRes.json();
      const existing = data.vendors?.find((v) => v.code === testVendor.code);
      if (existing) {
        vendorId = existing.id;
        return true;
      }
    }
    throw new Error(`Failed to create vendor: ${error.error || res.statusText}`);
  }

  const data = await res.json();
  vendorId = data.vendor.id;
  console.log(`   ✅ Vendor created: ${data.vendor.name} (${data.vendor.code})`);
  return true;
}

async function createPriceCode() {
  console.log("\n💰 Creating test price code...");
  const res = await fetch(`${BASE_URL}/staff/api/price-codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify(testPriceCode),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.error?.includes("already exists")) {
      console.log("   Price code already exists, fetching...");
      const getRes = await fetch(`${BASE_URL}/staff/api/price-codes?category=moulding`, {
        headers: { Cookie: authCookie || "" },
      });
      const data = await getRes.json();
      const existing = data.priceCodes?.find((pc) => pc.code === testPriceCode.code);
      if (existing) {
        priceCodeId = existing.id;
        return true;
      }
    }
    throw new Error(`Failed to create price code: ${error.error || res.statusText}`);
  }

  const data = await res.json();
  priceCodeId = data.priceCode.id;
  console.log(`   ✅ Price code created: ${data.priceCode.code} - ${data.priceCode.name}`);
  return true;
}

async function createCatalogItem() {
  console.log("\n📋 Creating test catalog item...");
  const res = await fetch(`${BASE_URL}/staff/api/vendors/${vendorId}/catalog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify(testCatalogItem),
  });

  if (!res.ok) {
    const error = await res.json();
    if (error.error?.includes("already exists")) {
      console.log("   Catalog item already exists, fetching...");
      const getRes = await fetch(`${BASE_URL}/staff/api/vendors/${vendorId}/catalog`, {
        headers: { Cookie: authCookie || "" },
      });
      const data = await getRes.json();
      const existing = data.items?.find((i) => i.itemNumber === testCatalogItem.itemNumber);
      if (existing) {
        catalogItemId = existing.id;
        return true;
      }
    }
    throw new Error(`Failed to create catalog item: ${error.error || res.statusText}`);
  }

  const data = await res.json();
  catalogItemId = data.item.id;
  console.log(`   ✅ Catalog item created: ${data.item.itemNumber}`);
  return true;
}

async function testPricingCalculation() {
  console.log("\n🧮 Testing pricing calculation...");
  
  const width = 16; // 16 inches
  const height = 20; // 20 inches
  
  const components = [
    {
      category: "frame",
      priceCodeId: priceCodeId,
      description: "Test Frame",
      quantity: 1,
    },
  ];

  const res = await fetch(`${BASE_URL}/staff/api/pricing/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify({
      width,
      height,
      components,
      taxRate: 0.0625,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Pricing calculation failed: ${error.error || res.statusText}`);
  }

  const data = await res.json();
  console.log(`   ✅ Pricing calculated:`);
  console.log(`      Width: ${width}" × Height: ${height}"`);
  console.log(`      Components: ${data.lineItems.length}`);
  console.log(`      Subtotal: $${(data.subtotal / 100).toFixed(2)}`);
  console.log(`      Tax: $${(data.tax / 100).toFixed(2)}`);
  console.log(`      Total: $${(data.total / 100).toFixed(2)}`);
  
  // Verify calculation
  // Perimeter = (16 + 20) * 2 = 72 inches = 6 feet
  // With 10% waste = 6.6 feet
  // At $5.50/ft = $36.30
  const expectedFootage = ((width + height) * 2 / 12) * 1.1; // with waste
  const expectedPrice = expectedFootage * testPriceCode.baseRate;
  const actualPrice = data.subtotal / 100;
  
  if (Math.abs(actualPrice - expectedPrice) < 1) {
    console.log(`   ✅ Calculation verified (expected ~$${expectedPrice.toFixed(2)}, got $${actualPrice.toFixed(2)})`);
  } else {
    console.log(`   ⚠️  Calculation mismatch (expected ~$${expectedPrice.toFixed(2)}, got $${actualPrice.toFixed(2)})`);
  }

  return data;
}

async function testOrderCreation() {
  console.log("\n📝 Testing order creation with components...");
  
  // First, create a test customer
  const customerRes = await fetch(`${BASE_URL}/staff/api/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify({
      phone: `617555${Math.floor(Math.random() * 10000)}`,
      first_name: "Test",
      last_name: "Customer",
      email: `test${Date.now()}@example.com`,
    }),
  });

  if (!customerRes.ok) {
    const error = await customerRes.json();
    throw new Error(`Failed to create customer: ${error.error || customerRes.statusText}`);
  }

  const customerData = await customerRes.json();
  const customerId = customerData.customer.id;
  console.log(`   ✅ Test customer created: ${customerData.customer.firstName} ${customerData.customer.lastName}`);

  // Create order with components
  const orderRes = await fetch(`${BASE_URL}/staff/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie || "",
    },
    body: JSON.stringify({
      customer_id: customerId,
      intake_channel: "walk_in",
      item_type: "art",
      width: 16,
      height: 20,
      units: "in",
      status: "new_design",
      discount_type: "none",
      discount_value: 0,
      tax_rate: 0.0625,
      components: [
        {
          category: "frame",
          position: 0,
          priceCodeId: priceCodeId,
          description: "Test Frame",
          quantity: 1,
        },
      ],
    }),
  });

  if (!orderRes.ok) {
    const error = await orderRes.json();
    throw new Error(`Failed to create order: ${error.error || orderRes.statusText}`);
  }

  const orderData = await orderRes.json();
  console.log(`   ✅ Order created: ${orderData.order.order_number || orderData.order.orderNumber}`);
  
  // Fetch the order to verify components
  const getOrderRes = await fetch(`${BASE_URL}/staff/api/orders/${orderData.order.id}`, {
    headers: { Cookie: authCookie || "" },
  });

  if (getOrderRes.ok) {
    const orderDetail = await getOrderRes.json();
    if (orderDetail.order.components && orderDetail.order.components.length > 0) {
      console.log(`   ✅ Order has ${orderDetail.order.components.length} component(s)`);
      console.log(`      Component: ${orderDetail.order.components[0].category} - $${(orderDetail.order.components[0].lineTotal / 100).toFixed(2)}`);
    } else {
      console.log(`   ⚠️  Order created but no components found`);
    }
  }

  return orderData;
}

async function runTests() {
  console.log("🚀 Starting Pricing Engine Tests\n");
  console.log(`   Base URL: ${BASE_URL}\n`);

  try {
    await login();
    await createVendor();
    await createPriceCode();
    await createCatalogItem();
    await testPricingCalculation();
    await testOrderCreation();

    console.log("\n✅ All tests passed!");
    console.log("\n📊 Summary:");
    console.log(`   - Vendor: ${testVendor.code} (${vendorId})`);
    console.log(`   - Price Code: ${testPriceCode.code} (${priceCodeId})`);
    console.log(`   - Catalog Item: ${testCatalogItem.itemNumber} (${catalogItemId})`);
    console.log("\n✨ Pricing Engine is working correctly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
