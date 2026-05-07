import { test, expect } from "@playwright/test";
import { staffLogin, STAFF_EMAIL } from "./helpers/auth";

test.describe("Staff Authentication", () => {
  test("redirects unauthenticated user to login page", async ({ page }) => {
    await page.goto("/staff/dashboard");
    await expect(page).toHaveURL(/\/staff\/login/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/staff/login");
    await page.getByPlaceholder("Email").fill("wrong@example.com");
    await page.getByPlaceholder("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid login")).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page }) => {
    await staffLogin(page);
    // Should be on staff area (dashboard)
    await expect(page).toHaveURL(/\/staff/);
    // Nav bar links should be visible
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  });

  test("logout redirects to login page", async ({ page }) => {
    await staffLogin(page);
    // Click logout button (it's inside a form)
    await page.getByRole("button", { name: "Log out" }).click();
    // Should redirect to login
    await expect(page).toHaveURL(/\/staff\/login/, { timeout: 10_000 });
  });
});
