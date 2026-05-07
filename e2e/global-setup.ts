import { chromium } from "@playwright/test";
import { STAFF_EMAIL, STAFF_PASSWORD } from "./helpers/auth";
import path from "path";
import fs from "fs";

/**
 * Global setup: log in once and save the authenticated browser state.
 * All staff tests reuse this state via storageState, so we only
 * hit the login endpoint ONE time per full test run.
 */
export default async function globalSetup() {
  const baseURL =
    process.env.BASE_URL || "http://localhost:3000";

  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto("/staff/login");
    await page.getByPlaceholder("Email").fill(STAFF_EMAIL);
    await page.getByPlaceholder("Password").fill(STAFF_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes("/staff/login"), {
      timeout: 15_000,
    });

    // Verify we actually logged in
    await page.waitForSelector('a[href="/staff/dashboard"]', {
      timeout: 10_000,
    });

    console.log("✅ Global setup: Staff login successful");
  } catch (error) {
    console.error("❌ Global setup: Staff login FAILED. Tests requiring auth will fail.");
    console.error(error);
  }

  // Save the signed-in state (includes httpOnly cookies)
  const storagePath = path.join(authDir, "staff.json");
  await context.storageState({ path: storagePath });

  await browser.close();
}
