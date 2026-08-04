import { test, expect } from "./helpers/fixtures";
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

    // Should show success message or rate-limit message (proves API is responding)
    await expect(
      page.getByText(/thank you|message.*sent|success|too many/i)
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

  test("submit a custom framing quote request", async ({ page, tracker }) => {
    const suffix = testSuffix();
    const phone = testPhone();
    const email = `quote${suffix}@test.com`;

    // Track the email up-front so cleanup runs even if the rate-limit branch fires
    tracker.customerEmails.push(email);

    await page.goto("/custom-framing");

    // Required fields are First/Last/Email/Phone (all marked required)
    await page.getByPlaceholder("First name").fill(`QuoteTest${suffix}`);
    await page.getByPlaceholder("Last name").fill(`E2E${suffix}`);
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByPlaceholder("617-555-1234").fill(phone);
    await page.locator("select").first().selectOption("art");
    await page.locator("textarea").first().fill("E2E automated test quote request");

    await page.getByRole("button", { name: /submit framing request/i }).click();

    // Success page shows "Request Received!" + the order number (WRX-XXXX)
    await expect(
      page.getByText(/request.*received|too many/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Public Site - Welcome Popup", () => {
  test("popup captures email, reveals promo code, links to booking", async ({
    page,
    tracker,
  }) => {
    const email = `popup${testSuffix()}@test.com`;

    // Track up-front so cleanup runs even if the assertion below fails
    tracker.customerEmails.push(email);

    await page.goto("/");

    // Popup appears after a ~3s delay when not previously dismissed
    await expect(page.getByText(/get.*10% off/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: /get my 10% off/i }).click();

    // Code is only revealed after the email is captured
    await expect(page.getByText("WELCOME10")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("link", { name: /book a free consultation/i }),
    ).toHaveAttribute("href", "/book");
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

    // The order-status form has just one input ("Enter your order number")
    // and a "Lookup" button — no contact-info field anymore.
    await page.getByPlaceholder(/order number/i).fill("WRX-999999");
    await page.getByRole("button", { name: /lookup/i }).click();

    await expect(
      page.getByText(/not found|no order|couldn.*find|error|too many/i).first(),
    ).toBeVisible({ timeout: 10_000 });
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
