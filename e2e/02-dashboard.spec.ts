import { test, expect } from "@playwright/test";

test.describe("Staff Dashboard", () => {

  test("dashboard loads with KPI cards", async ({ page }) => {
    await page.goto("/staff/dashboard");
    // Wait for dashboard data to load
    await expect(page.getByText("Total Orders")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("This Month")).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Total Customers")).toBeVisible();
    await expect(page.getByText("Active Orders")).toBeVisible();
    await expect(page.getByText("Overdue")).toBeVisible();
    await expect(page.getByText("Estimates")).toBeVisible();
    await expect(page.getByText("On Hold")).toBeVisible();
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
    await expect(page.getByText("Total Orders")).toBeVisible({ timeout: 10_000 });
    // Click refresh and verify page doesn't error
    await page.getByRole("button", { name: "Refresh" }).click();
    // Still shows KPI after refresh
    await expect(page.getByText("Total Orders")).toBeVisible();
  });
});
