import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyRazorpaySignature } from "../../../../../../apps/web/src/server/billing/providers/razorpay/verify-signature";

describe("Razorpay signature", () => {
  it("accepts an authentic order or webhook digest", () => {
    const message = "order_123|pay_456";
    const signature = createHmac("sha256", "secret").update(message).digest("hex");
    expect(verifyRazorpaySignature(message, signature, "secret")).toBe(true);
  });

  it("rejects a wrong message or malformed digest", () => {
    const signature = createHmac("sha256", "secret").update("first").digest("hex");
    expect(verifyRazorpaySignature("second", signature, "secret")).toBe(false);
    expect(verifyRazorpaySignature("first", "xyz", "secret")).toBe(false);
  });
});
