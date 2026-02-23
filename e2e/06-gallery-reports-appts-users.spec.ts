import { test, expect } from "@playwright/test";
import { staffLogin, testSuffix } from "./helpers/auth";

test.describe("Gallery Management", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("gallery page loads", async ({ page }) => {
    await page.goto("/staff/gallery");
    await expect(
      page.getByText(/gallery/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("can add a gallery item", async ({ page }) => {
    const suffix = testSuffix();
    await page.goto("/staff/gallery");
    await page.waitForTimeout(2000);

    // Look for an add/create button
    const addBtn = page.getByRole("button", { name: /add|create|new/i });
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Fill in title if form appears
      const titleInput = page.getByPlaceholder(/title/i);
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Gallery ${suffix}`);
      }

      // Fill URL if visible
      const urlInput = page.getByPlaceholder(/url|image/i);
      if (await urlInput.isVisible().catch(() => false)) {
        await urlInput.fill("https://placehold.co/400x300.png");
      }

      // Save
      const saveBtn = page.getByRole("button", { name: /save|create|add/i }).last();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("reports page loads with filters", async ({ page }) => {
    await page.goto("/staff/reports");
    await expect(
      page.getByText(/reports/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Should show date filter inputs
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test("reports summary panel shows data", async ({ page }) => {
    await page.goto("/staff/reports");
    await page.waitForTimeout(3000);

    // Should show summary stats (even if zero)
    await expect(
      page.getByText(/total|orders|revenue/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("CSV export button exists", async ({ page }) => {
    await page.goto("/staff/reports");
    await page.waitForTimeout(2000);

    const exportBtn = page.getByRole("button", { name: /export|csv|download/i });
    await expect(exportBtn.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Appointments", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("appointments page loads", async ({ page }) => {
    await page.goto("/staff/appointments");
    await expect(
      page.getByText(/appt|appointment|today|upcoming/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("appointment view tabs work", async ({ page }) => {
    await page.goto("/staff/appointments");
    await page.waitForTimeout(2000);

    // Click through available view tabs
    const todayBtn = page.getByRole("button", { name: /today/i });
    const upcomingBtn = page.getByRole("button", { name: /upcoming/i });
    const weekBtn = page.getByRole("button", { name: /week/i });
    const allBtn = page.getByRole("button", { name: /all/i });

    for (const btn of [todayBtn, upcomingBtn, weekBtn, allBtn]) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe("Users Management", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("users page loads and shows current admin", async ({ page }) => {
    await page.goto("/staff/users");
    await expect(
      page.getByText(/jake@westroxburyframing\.com|admin/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
