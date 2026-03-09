import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * ──── HEADLESS TOGGLE ────
 * Set HEADLESS=false to watch the browser:
 *   $env:HEADLESS="false"; npx playwright test
 *
 * Default is headless (no popup windows).
 */
const headless = process.env.HEADLESS !== "false";

/**
 * Base URL — defaults to local dev server.
 * Override with BASE_URL env var to test against production:
 *   $env:BASE_URL="https://westroxburyframing.vercel.app"; npx playwright test
 */
const baseURL = process.env.BASE_URL || "http://localhost:3000";

const staffAuthFile = path.join(__dirname, "e2e", ".auth", "staff.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // run sequentially — tests depend on data created by earlier tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  timeout: 30_000,

  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL,
    headless,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: headless ? "off" : "on",
  },

  projects: [
    {
      name: "auth",
      use: {
        ...devices["Desktop Chrome"],
        // No storageState — auth tests need a clean slate
      },
      testMatch: /01-auth.*\.spec\.ts/,
    },
    {
      name: "staff",
      use: {
        ...devices["Desktop Chrome"],
        storageState: staffAuthFile,
      },
      testMatch: /0[2-68].*\.spec\.ts/,
    },
    {
      name: "public",
      use: {
        ...devices["Desktop Chrome"],
        // No storageState — public tests run unauthenticated
      },
      testMatch: /07.*\.spec\.ts/,
    },
  ],

  /* Start local dev server automatically if testing locally */
  ...(baseURL.includes("localhost")
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }
    : {}),
});
