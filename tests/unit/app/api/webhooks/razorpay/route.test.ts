import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/webhooks/razorpay/route";
import { processRazorpayWebhook } from "../../../../../../apps/web/src/server/billing/process-razorpay-webhook";
import { getBillingRuntime } from "../../../../../../apps/web/src/server/billing/billing-runtime";
import { BillingService } from "../../../../../../apps/web/src/server/billing/billing-service";
import { createDatabaseClient } from "../../../../../../packages/database-runtime/src/client";

vi.mock("../../../../../../apps/web/src/server/billing/process-razorpay-webhook", () => ({ processRazorpayWebhook: vi.fn() }));
vi.mock("../../../../../../apps/web/src/server/billing/billing-runtime", () => ({ getBillingRuntime: vi.fn() }));

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("POST Razorpay webhook", () => {
  it("rejects a bad signature before event processing", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    const response = await POST(new Request("https://app.example.test/api/webhooks/razorpay", {
      method: "POST", headers: { "x-razorpay-signature": "0".repeat(64), "x-razorpay-event-id": "evt_1" },
      body: JSON.stringify({ event: "payment.failed", payload: {} }),
    }));
    expect(response.status).toBe(401);
    expect(processRazorpayWebhook).not.toHaveBeenCalled();
  });

  it("verifies the exact raw body before parsing and dispatching", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    const database = createDatabaseClient({ connectionString: "postgresql://postgres:postgres@localhost:5432/test" });
    vi.mocked(getBillingRuntime).mockReturnValue({ database, service: new BillingService(database, {
      APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_WEBHOOK_SECRET: "webhook",
    }) });
    const body = '{"event":"payment.failed", "payload":{}}';
    const signature = createHmac("sha256", "webhook").update(body).digest("hex");
    const response = await POST(new Request("https://app.example.test/api/webhooks/razorpay", {
      method: "POST", headers: { "x-razorpay-signature": signature, "x-razorpay-event-id": "evt_1" }, body,
    }));
    expect(response.status).toBe(200);
    expect(processRazorpayWebhook).toHaveBeenCalledWith(database, "evt_1", { event: "payment.failed", payload: {} });
    await database.$disconnect();
  });
});
