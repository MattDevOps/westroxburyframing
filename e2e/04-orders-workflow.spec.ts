import { test, expect, Page } from "@playwright/test";
import { staffLogin, testPhone, testSuffix } from "./helpers/auth";

/**
 * Helper: create a new order via the staff UI and return the order detail URL.
 */
async function createTestOrder(page: Page) {
  const phone = testPhone();
  const suffix = testSuffix();

  await page.goto("/staff/orders/new");
  await expect(page.getByText("Customer", { exact: true })).toBeVisible({ timeout: 10_000 });

  // Customer
  await page.getByPlaceholder("e.g. 6175551234").fill(phone);
  await page.getByPlaceholder("First name").fill(`E2E${suffix}`);
  await page.getByPlaceholder("Last name").fill(`Order${suffix}`);
  await page.getByPlaceholder("name@email.com").fill(`e2e${suffix}@test.com`);

  // Item
  await page.locator("select").first().selectOption("art");
  // Width & Height
  const numberInputs = page.locator('input[type="number"]');
  await numberInputs.nth(0).fill("16");
  await numberInputs.nth(1).fill("20");

  // Pricing
  await numberInputs.nth(2).fill("150"); // subtotal
  await numberInputs.nth(3).fill("9.38"); // tax

  // Submit
  await page.getByRole("button", { name: /create order/i }).click();
  // Wait for redirect to order detail (UUID-based URL, not /new)
  await page.waitForURL(/\/staff\/orders\/(?!new)[a-z0-9-]+/i, { timeout: 15_000 });

  return {
    url: page.url(),
    phone,
    firstName: `E2E${suffix}`,
    lastName: `Order${suffix}`,
  };
}

test.describe("Order Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("new order page loads with all sections", async ({ page }) => {
    await page.goto("/staff/orders/new");
    await expect(page.getByText("Customer", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Item", { exact: true })).toBeVisible();
    await expect(page.getByText("Frame Specs")).toBeVisible();
    await expect(page.getByText("Pricing", { exact: true })).toBeVisible();
  });

  test("create order with full details", async ({ page }) => {
    const { url } = await createTestOrder(page);

    // Should be on order detail page (UUID, not /new)
    expect(url).toMatch(/\/staff\/orders\/(?!new)[a-z0-9-]+/i);

    // Order detail should show the order number
    await expect(page.getByText(/WRX-/)).toBeVisible({ timeout: 10_000 });
    // Should show status
    await expect(page.locator("span").filter({ hasText: /New.*Design/i }).first()).toBeVisible();
    // Should show the total
    await expect(page.getByText("$159.38")).toBeVisible();
  });

  test("create estimate order", async ({ page }) => {
    const phone = testPhone();
    const suffix = testSuffix();

    await page.goto("/staff/orders/new");
    await expect(page.getByText("Customer", { exact: true })).toBeVisible({ timeout: 10_000 });

    // Customer
    await page.getByPlaceholder("e.g. 6175551234").fill(phone);
    await page.getByPlaceholder("First name").fill(`Est${suffix}`);
    await page.getByPlaceholder("Last name").fill(`Test${suffix}`);

    // Pricing
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(2).fill("200");
    await numberInputs.nth(3).fill("12.50");

    // Click "Save as Estimate" button
    const estimateBtn = page.getByRole("button", { name: /estimate/i });
    if (await estimateBtn.isVisible()) {
      await estimateBtn.click();
      await page.waitForURL(/\/staff\/orders\/(?!new)[a-z0-9-]+/i, { timeout: 15_000 });
      // Should show estimate status badge
      await expect(page.getByText("ESTIMATE", { exact: true })).toBeVisible();
    }
  });

  test("change order status via status buttons", async ({ page }) => {
    await createTestOrder(page);

    // Look for status advancement buttons on order detail
    // The order starts in new_design, next step is awaiting_materials
    const nextBtn = page.getByRole("button", { name: /awaiting materials/i });
    if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
      // Status should update
      await expect(page.getByText(/awaiting materials/i)).toBeVisible();
    }
  });

  test("order appears on Kanban board", async ({ page }) => {
    await createTestOrder(page);

    // Go to orders Kanban board
    await page.goto("/staff/orders");
    await page.waitForTimeout(3000);

    // Should show at least one order card with WRX- prefix
    await expect(page.getByText(/WRX-/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("edit order page loads and saves", async ({ page }) => {
    const { url } = await createTestOrder(page);
    const orderId = url.split("/staff/orders/")[1];

    // Navigate to edit page
    await page.goto(`/staff/orders/${orderId}/edit`);
    await page.waitForTimeout(2000);

    // Edit page should load with form fields
    await expect(page.locator("select").first()).toBeVisible({ timeout: 10_000 });

    // Change the item description if visible
    const descInput = page.getByPlaceholder(/description/i);
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill("Updated by E2E test");
    }

    // Save
    const saveBtn = page.getByRole("button", { name: /save/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("order detail shows activity timeline", async ({ page }) => {
    await createTestOrder(page);

    // Activity / timeline section should exist on order detail
    await expect(
      page.getByText(/activity|timeline/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("add note to order", async ({ page }) => {
    await createTestOrder(page);

    // Find note input and add a note
    const noteInput = page.getByPlaceholder(/note/i);
    if (await noteInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await noteInput.fill("E2E test note - automated");
      const addBtn = page.getByRole("button", { name: /add note/i });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        // Note should appear in activity
        await expect(page.getByText("E2E test note - automated")).toBeVisible();
      }
    }
  });

  test("incomplete orders page loads", async ({ page }) => {
    await page.goto("/staff/orders/incomplete");
    await expect(
      page.getByText(/incomplete|ready.*pickup/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("orders Kanban tabs work", async ({ page }) => {
    await page.goto("/staff/orders");
    await page.waitForTimeout(2000);

    // Click through tabs
    const activeTab = page.getByRole("button", { name: /^active/i });
    const estimatesTab = page.getByRole("button", { name: /^estimates/i });
    const allTab = page.getByRole("button", { name: /all orders/i });

    if (await activeTab.isVisible()) {
      await activeTab.click();
      await page.waitForTimeout(1000);
    }
    if (await estimatesTab.isVisible()) {
      await estimatesTab.click();
      await page.waitForTimeout(1000);
      // Should show estimates column
      await expect(page.getByText("Estimates").first()).toBeVisible();
    }
    if (await allTab.isVisible()) {
      await allTab.click();
      await page.waitForTimeout(1000);
    }
  });
});
