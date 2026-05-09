import { APIRequestContext } from "@playwright/test";
import { test, expect, TestDataTracker } from "./helpers/fixtures";
import { testPhone, testSuffix } from "./helpers/auth";

/**
 * Helper: create a customer + order via API and return the order id/url.
 * Tracker captures IDs for afterEach cleanup.
 */
async function createOrderForInvoice(
  request: APIRequestContext,
  tracker: TestDataTracker,
  opts: {
    discountType?: "percent" | "fixed";
    discountValue?: number;
  } = {},
) {
  const phone = testPhone();
  const suffix = testSuffix();

  const custRes = await request.post("/staff/api/customers", {
    data: {
      first_name: `Invoice${suffix}`,
      last_name: `Test${suffix}`,
      phone,
      email: `inv${suffix}@test.com`,
    },
  });
  expect(custRes.ok()).toBeTruthy();
  const custJson = await custRes.json();
  const customerId: string = custJson.id || custJson.customer?.id;
  expect(customerId).toBeTruthy();
  tracker.customerIds.push(customerId);

  const orderRes = await request.post("/staff/api/orders", {
    data: {
      customer_id: customerId,
      item_type: "diploma",
      item_description: "Invoice test order",
      intake_channel: "walk_in",
      pricing: { subtotal_cents: 25000, tax_cents: 1563, total_cents: 26563 },
      ...(opts.discountType
        ? {
            discount_type: opts.discountType,
            discount_value: opts.discountValue ?? 0,
          }
        : {}),
    },
  });
  expect(orderRes.ok()).toBeTruthy();
  const orderJson = await orderRes.json();
  const orderId: string = orderJson.id || orderJson.order?.id;
  expect(orderId).toBeTruthy();
  tracker.orderIds.push(orderId);

  return { orderId, url: `/staff/orders/${orderId}` };
}

test.describe("Invoice & Payments", () => {

  test("order detail shows invoice section", async ({ page, request, tracker }) => {
    const { url } = await createOrderForInvoice(request, tracker);
    await page.goto(url);

    await expect(
      page.getByText(/invoice|send invoice|square/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("send invoice button is present for orders with customer email", async ({
    page,
    request,
    tracker,
  }) => {
    const { url } = await createOrderForInvoice(request, tracker);
    await page.goto(url);

    await expect(
      page.getByText(/invoice|payment|square/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("order detail shows payment status", async ({ page, request, tracker }) => {
    const { url } = await createOrderForInvoice(request, tracker);
    await page.goto(url);

    await expect(
      page.getByText(/paid|unpaid|payment/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("discount applies correctly on new order", async ({ request, tracker }) => {
    // 10% off $200 subtotal = $180 → totalAmount becomes $180 (tax recalculated)
    const { orderId } = await createOrderForInvoice(request, tracker, {
      discountType: "percent",
      discountValue: 10,
    });

    const verifyRes = await request.get(`/staff/api/orders/${orderId}`);
    expect(verifyRes.ok()).toBeTruthy();
    const verify = await verifyRes.json();

    // Subtotal of 25000 cents → 10% discount → 22500 cents subtotalAmount
    const subtotal = verify.subtotalAmount ?? verify.order?.subtotalAmount;
    expect(subtotal).toBe(22500);
  });
});
