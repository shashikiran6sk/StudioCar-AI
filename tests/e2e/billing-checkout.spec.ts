import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";

const databaseUrl = process.env["DATABASE_URL"];
const billingTest = databaseUrl ? test : test.skip;
const SESSION_TOKEN = "r".repeat(43);
const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const HOSTED_CHECKOUT_URL = "https://api.razorpay.com/checkout/synthetic";
const CHECKOUT_CONNECTION_URL = "https://api.razorpay.com/synthetic-health";

// Exercises the application's browser wiring and real CSP without contacting
// Razorpay or claiming that synthetic confirmation is a real financial effect.
const CHECKOUT_SCRIPT = `
  window.Razorpay = class {
    constructor(options) { this.options = options; }
    on() {}
    open() {
      const frame = document.createElement('iframe');
      frame.title = 'Synthetic Razorpay Checkout';
      frame.src = '${HOSTED_CHECKOUT_URL}';
      document.body.appendChild(frame);
      fetch('${CHECKOUT_CONNECTION_URL}').then(() => {
        this.options.handler({
          razorpay_payment_id: 'pay_synthetic',
          razorpay_signature: '0000000000000000000000000000000000000000000000000000000000000000',
          razorpay_order_id: this.options.order_id
        });
      });
    }
  };
`;

billingTest("loads repeatable Plus Checkout through the browser security policy", async ({ page }, testInfo) => {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
  const database = new Pool({ connectionString: databaseUrl, max: 1 });
  const userId = randomUUID();
  let scriptsLoaded = 0;
  let ordersVerified = 0;
  let statusPolls = 0;

  try {
    await database.query(
      'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [userId, "Checkout Browser Fixture", `checkout-${userId}@studiocar.test`],
    );
    await database.query(
      'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
      [randomUUID(), userId, hashSessionToken(SESSION_TOKEN), new Date(Date.now() + 3_600_000)],
    );
    await page.context().addCookies([{
      name: "__Host-studiocar_session", value: SESSION_TOKEN, url: "https://localhost:3100",
      httpOnly: true, sameSite: "Lax", secure: true,
    }]);

    await page.route(CHECKOUT_SCRIPT_URL, async (route) => {
      scriptsLoaded += 1;
      await route.fulfill({ contentType: "application/javascript", body: CHECKOUT_SCRIPT });
    });
    await page.route(HOSTED_CHECKOUT_URL, async (route) => {
      await route.fulfill({ contentType: "text/html", body: "<p>Synthetic hosted Checkout</p>" });
    });
    await page.route(CHECKOUT_CONNECTION_URL, async (route) => {
      await route.fulfill({ json: { ok: true }, headers: { "access-control-allow-origin": "*" } });
    });
    await page.route("**/api/billing/orders", async (route) => {
      expect(route.request().postData()).toBe(JSON.stringify({ productCode: "STUDIO_PLUS" }));
      await route.fulfill({ json: {
        orderId: "order_synthetic", keyId: "rzp_test_browser", amount: 199900, currency: "INR", name: "Studio Plus",
      } });
    });
    await page.route("**/api/billing/orders/verify", async (route) => {
      ordersVerified += 1;
      expect(route.request().postData()).toContain('"razorpay_order_id":"order_synthetic"');
      await route.fulfill({ json: { ok: true } });
    });
    await page.route("**/api/billing/status?**", async (route) => {
      statusPolls += 1;
      await route.fulfill({ json: {
        purchasedCredits: statusPolls > 1 ? 100 : 0, purchasedCreditsGranted: statusPolls > 1 ? 100 : 0, checkoutPaymentStatus: statusPolls > 1 ? "PAID" : "VERIFIED",
      } });
    });

    const response = await page.goto("/settings/billing");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("button", { name: "Choose StudioCar Plus" })).toBeEnabled();
    await expect(page.getByText("Studio Pro")).toHaveCount(0);
    expect(scriptsLoaded).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Choose StudioCar Plus" }).click();
    await expect(page.frameLocator('iframe[title="Synthetic Razorpay Checkout"]').getByText("Synthetic hosted Checkout")).toBeVisible();
    await expect(page.getByText("Payment confirmed. Your credits are updated. View payment history in Profile.")).toBeVisible();
    expect(ordersVerified).toBe(1);
    await page.locator('iframe[title="Synthetic Razorpay Checkout"]').evaluate((frame) => frame.remove());

    expect(statusPolls).toBeGreaterThan(1);
    for (const path of ["/api/billing/subscriptions", "/api/billing/subscriptions/verify", "/api/billing/subscriptions/cancel"]) {
      const removed = await page.request.post(path, { data: {} });
      expect(removed.status()).toBe(404);
    }
    await page.screenshot({ fullPage: true, path: testInfo.outputPath("billing-checkout-confirmed.png") });
    // History presentation uses an explicit synthetic fixture, not a real capture.
    await database.query(
      'INSERT INTO "Payment" ("id", "userId", "productCode", "billingType", "amountPaise", "currency", "includedImages", "status", "razorpayOrderId", "razorpayPaymentId", "paidAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [randomUUID(), userId, "STUDIO_PLUS", "ONE_TIME", 199900, "INR", 100, "PAID", "order_synthetic", "pay_synthetic"],
    );
    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { name: "Payment history" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Paid", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "₹1,999", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Receipt" })).toHaveCount(0);
    await page.screenshot({ fullPage: true, path: testInfo.outputPath("profile-payment-history.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#payment-history").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Payment history" })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("mobile-profile-payment-history.png") });

  } finally {
    await database.query('DELETE FROM "Payment" WHERE "userId" = $1', [userId]);
    await database.query('DELETE FROM "User" WHERE "id" = $1', [userId]);
    await database.end();
  }
});
