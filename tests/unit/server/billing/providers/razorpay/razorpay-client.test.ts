import { afterEach, describe, expect, it, vi } from "vitest";

import { RazorpayClient } from "../../../../../../apps/web/src/server/billing/providers/razorpay/razorpay-client";

afterEach(() => vi.unstubAllGlobals());

describe("Razorpay client", () => {
  it("creates an order with server-selected amount and no partial payment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "order_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new RazorpayClient({ APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_WEBHOOK_SECRET: "webhook" });
    await expect(client.createOrder({ amount: 199900, currency: "INR", receipt: "internal-1", userId: "user-1" })).resolves.toEqual({ id: "order_123" });
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe("https://api.razorpay.com/v1/orders");
    expect(JSON.parse(request?.[1]?.body)).toMatchObject({ amount: 199900, partial_payment: false, receipt: "internal-1" });
  });


});
