import { test, expect } from "./helpers/fixtures";

test.describe("Purchase Orders & Inventory", () => {
  test.use({ storageState: "e2e/.auth/staff.json" });

  test("should create a PO, receive items, and verify inventory update via API", async ({
    request,
    tracker,
  }) => {
    const uniqueId = Date.now();
    const vendorCode = `V-${uniqueId}`;

    const vendorRes = await request.post("/staff/api/vendors", {
      data: {
        name: `Test Vendor ${uniqueId}`,
        code: vendorCode,
        email: `vendor${uniqueId}@example.com`,
      },
    });
    expect(vendorRes.ok()).toBeTruthy();
    const vendorData = await vendorRes.json();
    const vendorId: string = vendorData.vendor.id;
    tracker.vendorIds.push(vendorId);

    const itemNumber = `ITEM-${uniqueId}`;
    const itemDesc = `Test Item ${uniqueId}`;
    const quantity = 10;
    const unitCost = 5.5;

    const poRes = await request.post("/staff/api/purchase-orders", {
      data: {
        vendorId,
        notes: "Test PO",
        lines: [
          {
            inventoryItemId: null,
            vendorItemNumber: itemNumber,
            description: itemDesc,
            quantityOrdered: quantity,
            unitCost,
            notes: "Test line",
          },
        ],
      },
    });
    expect(poRes.ok()).toBeTruthy();
    const poData = await poRes.json();
    const poId: string = poData.order.id;
    tracker.purchaseOrderIds.push(poId);

    const sentRes = await request.patch(`/staff/api/purchase-orders/${poId}`, {
      data: { status: "sent" },
    });
    expect(sentRes.ok()).toBeTruthy();

    const poDetailRes = await request.get(`/staff/api/purchase-orders/${poId}`);
    expect(poDetailRes.ok()).toBeTruthy();
    const poDetail = await poDetailRes.json();
    const lineId: string = poDetail.order.lines[0].id;

    const receiveRes = await request.post(
      `/staff/api/purchase-orders/${poId}/receive`,
      {
        data: {
          receivedLines: [
            { lineId, quantityReceived: quantity, costPerUnit: unitCost },
          ],
        },
      },
    );
    expect(receiveRes.ok()).toBeTruthy();
    const received = await receiveRes.json();

    // The receive route auto-creates an inventory item and links it to the PO
    // line. Generated SKU is `${vendor.code}-${vendorItemNumber}` (uppercased,
    // sanitized), so don't assume the bare item number — pull the linked
    // inventory item directly from the receive response.
    const linkedInventory = received.order?.lines?.[0]?.inventoryItem;
    expect(linkedInventory).toBeTruthy();
    expect(linkedInventory.id).toBeTruthy();
    tracker.inventoryItemIds.push(linkedInventory.id);

    // Confirm the SKU matches the documented pattern and quantity is correct
    expect(linkedInventory.sku.toUpperCase()).toContain(itemNumber.toUpperCase());

    const inventoryGetRes = await request.get(
      `/staff/api/inventory/${linkedInventory.id}`,
    );
    expect(inventoryGetRes.ok()).toBeTruthy();
    const invJson = await inventoryGetRes.json();
    const invItem = invJson.item || invJson;
    expect(Number(invItem.quantityOnHand)).toBe(quantity);

    // PO status should now be "received"
    const finalPoRes = await request.get(`/staff/api/purchase-orders/${poId}`);
    const finalPo = (await finalPoRes.json()).order;
    expect(finalPo.status).toBe("received");
  });
});
