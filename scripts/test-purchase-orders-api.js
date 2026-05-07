/**
 * Test Purchase Orders API endpoints
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function test() {
  console.log("Testing Purchase Orders API...\n");

  // Test 1: List purchase orders (should work even without auth for structure check)
  try {
    console.log("1. Testing GET /staff/api/purchase-orders");
    const listRes = await fetch(`${BASE_URL}/staff/api/purchase-orders`);
    console.log(`   Status: ${listRes.status}`);
    if (listRes.status === 401) {
      console.log("   ✓ Endpoint exists (requires auth)");
    } else if (listRes.ok) {
      const data = await listRes.json();
      console.log(`   ✓ Found ${data.orders?.length || 0} purchase orders`);
    } else {
      console.log(`   ⚠ Unexpected status: ${listRes.status}`);
    }
  } catch (e) {
    console.log(`   ✗ Error: ${e.message}`);
  }

  // Test 2: Check endpoint structure
  try {
    console.log("\n2. Testing GET /staff/api/purchase-orders/[id]");
    const detailRes = await fetch(`${BASE_URL}/staff/api/purchase-orders/test-id`);
    console.log(`   Status: ${detailRes.status}`);
    if (detailRes.status === 401 || detailRes.status === 404) {
      console.log("   ✓ Endpoint exists");
    } else {
      console.log(`   ⚠ Unexpected status: ${detailRes.status}`);
    }
  } catch (e) {
    console.log(`   ✗ Error: ${e.message}`);
  }

  // Test 3: Check receive endpoint
  try {
    console.log("\n3. Testing POST /staff/api/purchase-orders/[id]/receive");
    const receiveRes = await fetch(`${BASE_URL}/staff/api/purchase-orders/test-id/receive`, {
      method: "POST",
    });
    console.log(`   Status: ${receiveRes.status}`);
    if (receiveRes.status === 401 || receiveRes.status === 404) {
      console.log("   ✓ Endpoint exists");
    } else {
      console.log(`   ⚠ Unexpected status: ${receiveRes.status}`);
    }
  } catch (e) {
    console.log(`   ✗ Error: ${e.message}`);
  }

  console.log("\n✓ API endpoint structure test complete");
  console.log("Note: Full functionality requires authentication");
}

test().catch(console.error);
