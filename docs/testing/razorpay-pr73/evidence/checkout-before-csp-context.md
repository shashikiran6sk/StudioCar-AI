# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing-checkout.spec.ts >> loads Plus and Pro Checkout through the browser security policy
- Location: ../../tests/e2e/billing-checkout.spec.ts:38:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('button', { name: 'Choose Studio Plus' })
Expected: enabled
Received: disabled
Timeout:  5000ms

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: 'Choose Studio Plus' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Choose Studio Plus' })
    14 × locator resolved to <button disabled type="button" class="sc-button sc-button--secondary sc-button--default">Choose Studio Plus</button>
       - unexpected value "disabled"

```

```yaml
- button "Choose Studio Plus" [disabled]
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { randomUUID } from "node:crypto";
  3   | import { Pool } from "pg";
  4   |
  5   | import { hashSessionToken } from "../../apps/web/src/server/auth/session-service";
  6   |
  7   | const databaseUrl = process.env["DATABASE_URL"];
  8   | const billingTest = databaseUrl ? test : test.skip;
  9   | const SESSION_TOKEN = "r".repeat(43);
  10  | const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
  11  | const HOSTED_CHECKOUT_URL = "https://api.razorpay.com/checkout/synthetic";
  12  | const CHECKOUT_CONNECTION_URL = "https://api.razorpay.com/synthetic-health";
  13  |
  14  | // Exercises the application's browser wiring and real CSP without contacting
  15  | // Razorpay or claiming that synthetic confirmation is a real financial effect.
  16  | const CHECKOUT_SCRIPT = `
  17  |   window.Razorpay = class {
  18  |     constructor(options) { this.options = options; }
  19  |     on() {}
  20  |     open() {
  21  |       const frame = document.createElement('iframe');
  22  |       frame.title = 'Synthetic Razorpay Checkout';
  23  |       frame.src = '${HOSTED_CHECKOUT_URL}';
  24  |       document.body.appendChild(frame);
  25  |       fetch('${CHECKOUT_CONNECTION_URL}').then(() => {
  26  |         this.options.handler({
  27  |           razorpay_payment_id: 'pay_synthetic',
  28  |           razorpay_signature: 'synthetic_signature',
  29  |           ...(this.options.order_id
  30  |             ? { razorpay_order_id: this.options.order_id }
  31  |             : { razorpay_subscription_id: this.options.subscription_id })
  32  |         });
  33  |       });
  34  |     }
  35  |   };
  36  | `;
  37  |
  38  | billingTest("loads Plus and Pro Checkout through the browser security policy", async ({ page }, testInfo) => {
  39  |   if (!databaseUrl) throw new Error("DATABASE_URL is required for this test.");
  40  |   const database = new Pool({ connectionString: databaseUrl, max: 1 });
  41  |   const userId = randomUUID();
  42  |   let scriptsLoaded = 0;
  43  |   let ordersVerified = 0;
  44  |   let subscriptionsVerified = 0;
  45  |
  46  |   try {
  47  |     await database.query(
  48  |       'INSERT INTO "User" ("id", "displayName", "primaryEmail", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
  49  |       [userId, "Checkout Browser Fixture", `checkout-${userId}@studiocar.test`],
  50  |     );
  51  |     await database.query(
  52  |       'INSERT INTO "Session" ("id", "userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3, $4)',
  53  |       [randomUUID(), userId, hashSessionToken(SESSION_TOKEN), new Date(Date.now() + 3_600_000)],
  54  |     );
  55  |     await page.context().addCookies([{
  56  |       name: "__Host-studiocar_session", value: SESSION_TOKEN, url: "https://localhost:3100",
  57  |       httpOnly: true, sameSite: "Lax", secure: true,
  58  |     }]);
  59  |
  60  |     await page.route(CHECKOUT_SCRIPT_URL, async (route) => {
  61  |       scriptsLoaded += 1;
  62  |       await route.fulfill({ contentType: "application/javascript", body: CHECKOUT_SCRIPT });
  63  |     });
  64  |     await page.route(HOSTED_CHECKOUT_URL, async (route) => {
  65  |       await route.fulfill({ contentType: "text/html", body: "<p>Synthetic hosted Checkout</p>" });
  66  |     });
  67  |     await page.route(CHECKOUT_CONNECTION_URL, async (route) => {
  68  |       await route.fulfill({ json: { ok: true }, headers: { "access-control-allow-origin": "*" } });
  69  |     });
  70  |     await page.route("**/api/billing/orders", async (route) => {
  71  |       expect(route.request().postData()).toBe(JSON.stringify({ productCode: "STUDIO_PLUS" }));
  72  |       await route.fulfill({ json: {
  73  |         orderId: "order_synthetic", keyId: "rzp_test_browser", amount: 199900, currency: "INR", name: "Studio Plus",
  74  |       } });
  75  |     });
  76  |     await page.route("**/api/billing/subscriptions", async (route) => {
  77  |       expect(route.request().postData()).toBe(JSON.stringify({ planCode: "STUDIO_PRO_MONTHLY" }));
  78  |       await route.fulfill({ json: {
  79  |         subscriptionId: "sub_synthetic", keyId: "rzp_test_browser", amount: 549900, currency: "INR", name: "Studio Pro",
  80  |       } });
  81  |     });
  82  |     await page.route("**/api/billing/orders/verify", async (route) => {
  83  |       ordersVerified += 1;
  84  |       expect(route.request().postData()).toContain('"razorpay_order_id":"order_synthetic"');
  85  |       await route.fulfill({ json: { ok: true } });
  86  |     });
  87  |     await page.route("**/api/billing/subscriptions/verify", async (route) => {
  88  |       subscriptionsVerified += 1;
  89  |       expect(route.request().postData()).toContain('"razorpay_subscription_id":"sub_synthetic"');
  90  |       await route.fulfill({ json: { ok: true } });
  91  |     });
  92  |     await page.route("**/api/billing/status?**", async (route) => {
  93  |       await route.fulfill({ json: {
  94  |         checkoutPaymentStatus: "PAID", checkoutSubscriptionStatus: "ACTIVE", subscription: { remaining: 400 },
  95  |       } });
  96  |     });
  97  |
  98  |     const response = await page.goto("/settings/billing");
  99  |     expect(response?.status()).toBe(200);
> 100 |     await expect(page.getByRole("button", { name: "Choose Studio Plus" })).toBeEnabled();
      |                                                                            ^ Error: expect(locator).toBeEnabled() failed
  101 |     expect(scriptsLoaded).toBeGreaterThan(0);
  102 |     await page.getByRole("button", { name: "Choose Studio Plus" }).click();
  103 |     await expect(page.frameLocator('iframe[title="Synthetic Razorpay Checkout"]').getByText("Synthetic hosted Checkout")).toBeVisible();
  104 |     await expect(page.getByText("Payment confirmed. 100 credits have been added.")).toBeVisible();
  105 |     expect(ordersVerified).toBe(1);
  106 |     await page.locator('iframe[title="Synthetic Razorpay Checkout"]').evaluate((frame) => frame.remove());
  107 |
  108 |     await page.getByRole("button", { name: "Choose Studio Pro" }).click();
  109 |     await expect(page.frameLocator('iframe[title="Synthetic Razorpay Checkout"]').getByText("Synthetic hosted Checkout")).toBeVisible();
  110 |     await expect(page.getByText("Studio Pro is active. 400 images are available for the current billing period.")).toBeVisible();
  111 |     expect(subscriptionsVerified).toBe(1);
  112 |     await page.locator('iframe[title="Synthetic Razorpay Checkout"]').evaluate((frame) => frame.remove());
  113 |     await page.screenshot({ fullPage: true, path: testInfo.outputPath("billing-checkout-confirmed.png") });
  114 |   } finally {
  115 |     await database.query('DELETE FROM "User" WHERE "id" = $1', [userId]);
  116 |     await database.end();
  117 |   }
  118 | });
  119 |
```
