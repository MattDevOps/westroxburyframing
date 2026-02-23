import { test, expect } from "@playwright/test";
import { staffLogin, testPhone, testSuffix } from "./helpers/auth";

test.describe("Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("customers page loads", async ({ page }) => {
    await page.goto("/staff/customers");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10_000 });
  });

  test("create customer via new order form and verify on customers page", async ({
    page,
  }) => {
    const phone = testPhone();
    const suffix = testSuffix();
    const firstName = `TestFirst${suffix}`;
    const lastName = `TestLast${suffix}`;
    const email = `test${suffix}@e2e.test`;

    // Go to new order (which creates the customer inline)
    await page.goto("/staff/orders/new");
    await expect(page.getByText("Customer")).toBeVisible({ timeout: 10_000 });

    // Fill customer fields
    await page.getByPlaceholder("e.g. 6175551234").fill(phone);
    await page.getByPlaceholder("First name").fill(firstName);
    await page.getByPlaceholder("Last name").fill(lastName);
    await page.getByPlaceholder("name@email.com").fill(email);

    // Fill minimum order fields
    await page.locator('select').first().selectOption("art");

    // Fill pricing (subtotal & tax)
    const subtotalInput = page.locator('input[type="number"]').nth(2);
    await subtotalInput.fill("100");
    const taxInput = page.locator('input[type="number"]').nth(3);
    await taxInput.fill("6.25");

    // Submit order
    await page.getByRole("button", { name: /create order/i }).click();

    // Wait for redirect to order detail page
    await page.waitForURL(/\/staff\/orders\//, { timeout: 15_000 });

    // Now verify the customer exists
    await page.goto("/staff/customers");
    await page.getByPlaceholder(/search/i).fill(firstName);
    // Trigger search
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);

    // Customer should appear in the list
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10_000 });
  });

  test("customer detail page loads", async ({ page }) => {
    // Navigate to customers page
    await page.goto("/staff/customers");
    await page.waitForTimeout(2000);

    // Click on the first customer link if any exist
    const firstCustomerLink = page.locator('a[href^="/staff/customers/"]').first();
    if (await firstCustomerLink.isVisible()) {
      await firstCustomerLink.click();
      await page.waitForURL(/\/staff\/customers\//, { timeout: 10_000 });
      // Should show customer details
      await expect(page.getByText(/phone/i)).toBeVisible();
    }
  });
});
