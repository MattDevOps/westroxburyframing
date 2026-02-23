import { test, expect } from "@playwright/test";
import { testPhone, testSuffix } from "./helpers/auth";

test.describe("Public Site - Pages Load", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=West Roxbury Framing").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("services page loads", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("framed art page loads", async ({ page }) => {
    await page.goto("/framed-art");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("restoration page loads", async ({ page }) => {
    await page.goto("/restoration");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("testimonials page loads", async ({ page }) => {
    await page.goto("/testimonials");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("booking page loads", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("policies page loads", async ({ page }) => {
    await page.goto("/policies");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Public Site - Contact Form", () => {
  test("contact form has required fields", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForTimeout(1000);
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
  });

  test("contact form submits successfully", async ({ page }) => {
    const suffix = testSuffix();
    await page.goto("/contact");
    await page.waitForTimeout(1000);

    await page.getByLabel("Name").fill(`E2E Test ${suffix}`);
    await page.getByLabel("Phone number").fill("5551234567");
    await page.getByLabel("Email address").fill(`e2e${suffix}@test.com`);
    await page.getByLabel("Message").fill("Automated E2E test message — please ignore.");

    await page.getByRole("button", { name: /send/i }).click();

    // Should show success message
    await expect(
      page.getByText(/thank you|message.*sent|success/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Public Site - Custom Framing Quote", () => {
  test("custom framing page loads with form", async ({ page }) => {
    await page.goto("/custom-framing");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    // Should have form inputs
    await expect(page.getByPlaceholder(/first/i).first()).toBeVisible();
  });

  test("submit a custom framing quote request", async ({ page }) => {
    const suffix = testSuffix();
    const phone = testPhone();

    await page.goto("/custom-framing");
    await page.waitForTimeout(2000);

    // Fill out the quote form
    await page.getByPlaceholder(/first/i).first().fill(`QuoteTest${suffix}`);
    await page.getByPlaceholder(/last/i).first().fill(`E2E${suffix}`);

    // Email and phone
    const emailInput = page.getByPlaceholder(/email/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(`quote${suffix}@test.com`);
    }
    const phoneInput = page.getByPlaceholder(/phone/i).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(phone);
    }

    // Select item type
    const itemSelect = page.locator("select").first();
    if (await itemSelect.isVisible()) {
      await itemSelect.selectOption("art");
    }

    // Fill description if visible
    const descInput = page.locator("textarea").first();
    if (await descInput.isVisible()) {
      await descInput.fill("E2E automated test quote request");
    }

    // Submit
    const submitBtn = page.getByRole("button", { name: /submit|request|send|get.*quote/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Should show a success state (order number or thank you)
      await expect(
        page.getByText(/WRX-|thank|submitted|success|received/i).first()
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});

test.describe("Public Site - Order Status Tracker", () => {
  test("order status page loads with form", async ({ page }) => {
    await page.goto("/order-status");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("order status search with invalid order shows error", async ({
    page,
  }) => {
    await page.goto("/order-status");
    await page.waitForTimeout(1000);

    // Fill in order number
    const orderInput = page.locator('input').first();
    await orderInput.fill("WRX-999999");

    // Fill contact info
    const contactInput = page.locator('input').nth(1);
    await contactInput.fill("nobody@test.com");

    // Submit
    const searchBtn = page.getByRole("button", { name: /search|check|track|look/i });
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForTimeout(3000);

      // Should show "not found" or error
      await expect(
        page.getByText(/not found|no order|couldn.*find|error/i).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe("Public Site - Navigation", () => {
  test("header nav links work", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Click services link
    const servicesLink = page.getByRole("link", { name: /services/i }).first();
    if (await servicesLink.isVisible()) {
      await servicesLink.click();
      await expect(page).toHaveURL(/\/services/, { timeout: 10_000 });
    }
  });

  test("footer has quick links", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Footer should have "Track Your Order" link (the actual text in the footer)
    await expect(
      page.getByRole("link", { name: /track your order/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
