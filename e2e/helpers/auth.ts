import { Page, expect } from "@playwright/test";

/**
 * Staff login credentials — reads from env or falls back to defaults.
 */
export const STAFF_EMAIL =
  process.env.STAFF_EMAIL || "jake@westroxburyframing.com";
export const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "framing!123@";

/**
 * Log into the staff area.
 * After this call the page will be on /staff (dashboard redirect).
 */
export async function staffLogin(page: Page) {
  await page.goto("/staff/login");
  await page.getByPlaceholder("Email").fill(STAFF_EMAIL);
  await page.getByPlaceholder("Password").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to /staff (dashboard)
  await page.waitForURL(/\/staff/, { timeout: 10_000 });
  // Verify we're on the dashboard, not still on login
  await expect(page).not.toHaveURL(/\/staff\/login/);
}

/**
 * Generate a unique phone number for test data (to avoid collisions).
 */
export function testPhone() {
  return `555${Date.now().toString().slice(-7)}`;
}

/**
 * Generate a unique timestamp-based suffix for test data.
 */
export function testSuffix() {
  return Date.now().toString(36).slice(-5);
}
