import { test as base, expect, APIRequestContext, request as playwrightRequest } from "@playwright/test";
import path from "path";

const STAFF_STORAGE = path.join(__dirname, "..", ".auth", "staff.json");

/**
 * Tracks records created by a test so they can be cleaned up afterwards.
 * Real-world DB (Neon) is shared with the staff app, so leaving fake orders
 * or customers behind would pollute live data. Always pass the tracker into
 * helpers that create data.
 */
export class TestDataTracker {
  customerIds: string[] = [];
  orderIds: string[] = [];
  invoiceIds: string[] = [];
  purchaseOrderIds: string[] = [];
  vendorIds: string[] = [];
  inventoryItemIds: string[] = [];
  // Public flows return order numbers (WRX-XXXX) and we may only know the
  // customer's email — track those for after-the-fact lookup.
  orderNumbers: string[] = [];
  customerEmails: string[] = [];

  hasAnything(): boolean {
    return (
      this.customerIds.length +
        this.orderIds.length +
        this.invoiceIds.length +
        this.purchaseOrderIds.length +
        this.vendorIds.length +
        this.inventoryItemIds.length +
        this.orderNumbers.length +
        this.customerEmails.length >
      0
    );
  }

  async cleanup(staff: APIRequestContext) {
    // Resolve customer emails (e.g. from public-site flows) to ids + their orders.
    for (const email of this.customerEmails) {
      try {
        const res = await staff.get(
          `/staff/api/customers?q=${encodeURIComponent(email)}&limit=10`,
        );
        if (!res.ok()) continue;
        const json = await res.json();
        const list: any[] = json.customers || json.items || [];
        for (const c of list) {
          if ((c.email || "").toLowerCase() !== email.toLowerCase()) continue;
          if (c.id) this.customerIds.push(c.id);
          // Pull the customer's orders so we can delete them first
          try {
            const detailRes = await staff.get(`/staff/api/customers/${c.id}`);
            if (detailRes.ok()) {
              const detail = await detailRes.json();
              for (const o of (detail.orders || []) as any[]) {
                if (o.id) this.orderIds.push(o.id);
              }
            }
          } catch {}
        }
      } catch {}
    }

    // Order numbers — look them up via the linked customer rather than the
    // orders search, which is filtered by location and excludes public orders.
    // We don't have email here; fall back to the orders endpoint anyway.
    for (const num of this.orderNumbers) {
      try {
        const res = await staff.get(
          `/staff/api/orders?q=${encodeURIComponent(num)}&limit=10`,
        );
        if (!res.ok()) continue;
        const json = await res.json();
        const list: any[] = json.orders || json.items || [];
        for (const o of list) {
          if (o.order_number === num || o.orderNumber === num) {
            const id = o.id;
            if (id) this.orderIds.push(id);
            const cid = o.customer_id || o.customerId;
            if (cid) this.customerIds.push(cid);
          }
        }
      } catch {}
    }

    // Order matters: PO/invoice/order before vendor/customer/inventory.
    // Received/partial POs require admin + removeInventory flag.
    for (const id of this.purchaseOrderIds) {
      await staff
        .delete(`/staff/api/purchase-orders/${id}`, {
          data: { removeInventory: true },
        })
        .catch(() => {});
    }
    for (const id of this.invoiceIds) {
      await staff.delete(`/staff/api/invoices/${id}`).catch(() => {});
    }
    for (const id of this.orderIds) {
      await staff.delete(`/staff/api/orders/${id}`).catch(() => {});
    }
    for (const id of this.customerIds) {
      await staff.delete(`/staff/api/customers/${id}`).catch(() => {});
    }
    for (const id of this.inventoryItemIds) {
      await staff.delete(`/staff/api/inventory/${id}`).catch(() => {});
    }

    // Vendors can't be deleted while they have catalog items.
    // The PO receive flow auto-creates a VendorCatalogItem, so for each vendor
    // we look up its catalog items and delete them first.
    for (const id of this.vendorIds) {
      try {
        const res = await staff.get(`/staff/api/vendors/${id}/catalog`);
        if (res.ok()) {
          const json = await res.json();
          const items: any[] = json.items || json.catalogItems || [];
          for (const it of items) {
            const itemId = it.id;
            if (itemId) {
              await staff
                .delete(`/staff/api/vendors/catalog/${itemId}`)
                .catch(() => {});
            }
          }
        }
      } catch {}
      await staff.delete(`/staff/api/vendors/${id}`).catch(() => {});
    }
  }
}

export const test = base.extend<{ tracker: TestDataTracker }>({
  tracker: async ({}, use, testInfo) => {
    const tracker = new TestDataTracker();
    await use(tracker);

    if (!tracker.hasAnything()) return;

    // Always cleanup using a fresh staff-authenticated request context, even
    // when the test itself runs in the unauthenticated public project.
    const baseURL =
      (testInfo.project.use as any).baseURL ||
      process.env.BASE_URL ||
      "http://localhost:3000";

    const staff = await playwrightRequest.newContext({
      baseURL,
      storageState: STAFF_STORAGE,
    });
    try {
      await tracker.cleanup(staff);
    } finally {
      await staff.dispose();
    }
  },
});

export { expect };
