import { test, expect } from "./helpers/fixtures";
import { testPhone, testSuffix } from "./helpers/auth";

test.describe("Customer Management", () => {

  test("customers page loads", async ({ page }) => {
    await page.goto("/staff/customers");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10_000 });
  });

  test("create customer via API and verify on customers page", async ({
    page,
    tracker,
  }) => {
    const phone = testPhone();
    const suffix = testSuffix();
    const firstName = `TestFirst${suffix}`;
    const lastName = `TestLast${suffix}`;
    const email = `test${suffix}@e2e.test`;

    // Create the customer via the staff API (the orders/new UI is now a multi-step wizard)
    const custRes = await page.request.post("/staff/api/customers", {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
      },
    });
    expect(custRes.ok()).toBeTruthy();
    const created = await custRes.json();
    const customerId: string = created.id || created.customer?.id;
    if (customerId) tracker.customerIds.push(customerId);

    // Verify the customer appears on the customers page when searched
    await page.goto("/staff/customers");
    await page.getByPlaceholder(/search/i).fill(firstName);
    await page.keyboard.press("Enter");
    await expect(page.getByText(firstName).first()).toBeVisible({ timeout: 10_000 });
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
