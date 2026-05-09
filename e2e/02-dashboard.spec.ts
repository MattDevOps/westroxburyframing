import { test, expect } from "./helpers/fixtures";
import { testPhone, testSuffix } from "./helpers/auth";

test.describe("Staff Dashboard", () => {

  test("dashboard loads with KPI cards", async ({ page }) => {
    await page.goto("/staff/dashboard");
    // Wait for dashboard data to load
    await expect(page.getByText("Open Orders", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Today's Revenue")).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Revenue (Month)")).toBeVisible();
    await expect(page.getByText("Active Orders")).toBeVisible();
    await expect(page.getByText("Overdue", { exact: true })).toBeVisible();
    await expect(page.getByText("Estimates").first()).toBeVisible();
    await expect(page.getByText("On Hold").first()).toBeVisible();
  });

  test("dashboard shows revenue chart section", async ({ page }) => {
    await page.goto("/staff/dashboard");
    await expect(
      page.getByText("Revenue (Last 6 Months)")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard shows orders by status section", async ({ page }) => {
    await page.goto("/staff/dashboard");
    await expect(page.getByText("Orders by Status")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("dashboard refresh button works", async ({ page }) => {
    await page.goto("/staff/dashboard");
    await expect(page.getByText("Open Orders", { exact: true })).toBeVisible({ timeout: 10_000 });
    // Click refresh and verify page doesn't error
    await page.getByRole("button", { name: "Refresh" }).click();
    // Still shows KPI after refresh
    await expect(page.getByText("Open Orders", { exact: true })).toBeVisible();
  });

  test("paid order with past due date is removed from overdue list", async ({ page, tracker }) => {
    const phone = testPhone();
    const suffix = testSuffix();

    // Create a customer via the API (form is now a multi-step wizard)
    const custRes = await page.request.post("/staff/api/customers", {
      data: {
        first_name: `Overdue${suffix}`,
        last_name: `Paid${suffix}`,
        phone,
        email: `overdue${suffix}@test.com`,
      },
    });
    expect(custRes.ok()).toBeTruthy();
    const customer = await custRes.json();
    const customerId: string = customer.id || customer.customer?.id;
    expect(customerId).toBeTruthy();
    tracker.customerIds.push(customerId);

    // Create an order. The POST endpoint defaults paidInFull=true, so we
    // PATCH it back to unpaid + past-due to set up the overdue scenario.
    const orderRes = await page.request.post("/staff/api/orders", {
      data: {
        customer_id: customerId,
        item_type: "diploma",
        item_description: "Overdue regression test",
        intake_channel: "walk_in",
        pricing: { subtotal_cents: 18000, tax_cents: 0, total_cents: 18000 },
      },
    });
    expect(orderRes.ok()).toBeTruthy();
    const created = await orderRes.json();
    const orderId: string = created.id || created.order?.id;
    expect(orderId).toBeTruthy();
    tracker.orderIds.push(orderId);

    const pastDue = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const patchRes = await page.request.patch(`/staff/api/orders/${orderId}`, {
      data: { dueDate: pastDue, paidInFull: false },
    });
    expect(patchRes.ok()).toBeTruthy();

    // Sanity check: order shows up as overdue before payment
    const beforeRes = await page.request.get("/staff/api/dashboard");
    expect(beforeRes.ok()).toBeTruthy();
    const before = await beforeRes.json();
    const beforeIds: string[] = (before.overdueOrders || []).map((o: any) => o.id);
    expect(beforeIds).toContain(orderId);

    // Mark the order paid via check
    const payRes = await page.request.post(
      `/staff/api/orders/${orderId}/mark-paid-check`,
      { data: { note: "regression test" } },
    );
    expect(payRes.ok()).toBeTruthy();

    // After payment the order must NOT be in the overdue list and count must drop
    const afterRes = await page.request.get("/staff/api/dashboard");
    expect(afterRes.ok()).toBeTruthy();
    const after = await afterRes.json();
    const afterIds: string[] = (after.overdueOrders || []).map((o: any) => o.id);
    expect(afterIds).not.toContain(orderId);
    expect(after.overdueCount).toBe(before.overdueCount - 1);
  });
});
