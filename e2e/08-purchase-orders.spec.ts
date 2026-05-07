
import { test, expect } from "@playwright/test";

test.describe("Purchase Orders & Inventory", () => {
  test.use({ storageState: "e2e/.auth/staff.json" });

  test("should create a PO, receive items, and verify inventory update via API", async ({
    request,
  }) => {
    const uniqueId = Date.now();
    const vendorCode = `V-${uniqueId}`;
    const vendorName = `Test Vendor ${uniqueId}`;
    
    // Create vendor
    const vendorRes = await request.post("/staff/api/vendors", {
      data: {
        name: vendorName,
        code: vendorCode,
        email: `vendor${uniqueId}@example.com`,
      },
    });
    expect(vendorRes.ok()).toBeTruthy();
    const vendorData = await vendorRes.json();
    const vendorId = vendorData.vendor.id;

    // Create PO
    const itemSku = `ITEM-${uniqueId}`;
    const itemDesc = `Test Item ${uniqueId}`;
    const quantity = 10;
    const unitCost = 5.50;

    const poRes = await request.post("/staff/api/purchase-orders", {
      data: {
        vendorId,
        notes: "Test PO",
        lines: [
          {
            inventoryItemId: null,
            vendorItemNumber: itemSku,
            description: itemDesc,
            quantityOrdered: quantity,
            unitCost: unitCost,
            notes: "Test line",
          },
        ],
      },
    });
    
    expect(poRes.ok()).toBeTruthy();
    const poData = await poRes.json();
    const poId = poData.order.id;
    console.log(`Created PO: ${poId}`);

    // Mark as Sent
    const sentRes = await request.patch(`/staff/api/purchase-orders/${poId}`, {
      data: { status: "sent" },
    });
    expect(sentRes.ok()).toBeTruthy();
    console.log(`Marked PO as sent`);

    // Get the PO to get the line ID
    const poDetailRes = await request.get(`/staff/api/purchase-orders/${poId}`);
    expect(poDetailRes.ok()).toBeTruthy();
    const poDetail = await poDetailRes.json();
    const lineId = poDetail.order.lines[0].id;
    console.log(`Line ID: ${lineId}`);

    // Receive items
    const receiveRes = await request.post(`/staff/api/purchase-orders/${poId}/receive`, {
      data: {
        receivedLines: [
          {
            lineId,
            quantityReceived: quantity,
            costPerUnit: unitCost,
          },
        ],
      },
    });
    
    expect(receiveRes.ok()).toBeTruthy();
    console.log(`Received items`);

    // Verify inventory was created
    const inventoryRes = await request.get("/staff/api/inventory");
    expect(inventoryRes.ok()).toBeTruthy();
    const inventoryData = await inventoryRes.json();
    const items = inventoryData.items || [];
    
    console.log(`Found ${items.length} inventory items`);
    const createdItem = items.find(i => i.sku === itemSku);
    
    if (createdItem) {
      console.log(`✓ Found item ${itemSku} with quantity ${createdItem.quantityOnHand}`);
      expect(Number(createdItem.quantityOnHand)).toBe(quantity);
    } else {
      console.error(`✗ Item ${itemSku} not found in inventory!`);
      console.error("Available items:", items.map(i => `${i.sku} (${i.quantityOnHand})`).join(", "));
      throw new Error(`Item ${itemSku} not found in inventory after receiving PO`);
    }
  });
});
    // 4. Receive Items
    // ---------------------------------------------------------
    // Click "Receive Items"
    await page.getByRole("button", { name: "Receive Items" }).click();
    
    // Modal appears.
    // Enter quantity to receive (it might be pre-filled with remaining).
    // Let's verify it's pre-filled or fill it.
    // The modal has inputs for each line.
    const modal = page.locator(".fixed.inset-0");
    await expect(modal).toBeVisible();
    
    // Check if quantity is already filled (it defaults to remaining in the code)
    const receiveInput = modal.locator('input[type="number"]').first();
    await expect(receiveInput).toHaveValue(quantity);
    
    // Submit Receive
    await modal.getByRole("button", { name: "Receive Items" }).click();
    
    // Wait for success message or UI update
    // The code does `alert("Items received...")` so we might need to handle dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Verify status is now "received" or "partial" (if fully received, it should be "received"?)
    // Wait, the status logic might not auto-update to "received" if we only receive items?
    // Let's check the code... 
    // The `receive/route.ts` doesn't seem to update the parent PO status to "received" automatically!
    // It only updates line items.
    // The UI `loadOrder` might show "All items received" but status might remain "sent" or "partial"?
    // Ah, wait. If I edited `[id]/route.ts`, that logic DOES handle status updates.
    // But `receive/route.ts` might NOT.
    
    // If the test fails here because status isn't "received", then that's a finding!
    // But let's check inventory regardless of PO status.
    
    // ---------------------------------------------------------
    // 5. Verify Inventory
    // ---------------------------------------------------------
    await page.goto("/staff/inventory");
    
    // There is no search box in the inventory page currently.
    // We just look for the item in the list.
    
    // Verify the item appears in the list
    await expect(page.getByText(itemSku)).toBeVisible();
    
    // Verify Quantity
    // Find the row with the SKU and check for quantity
    const row = page.locator("tr", { hasText: itemSku });
    await expect(row).toContainText(quantity); // "10"
  });
});
