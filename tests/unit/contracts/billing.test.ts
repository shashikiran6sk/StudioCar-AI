import { describe, expect, it } from "vitest";

import { CreateBillingOrderSchema, CreateBillingSubscriptionSchema, RazorpayWebhookSchema } from "../../../packages/contracts/src/billing";

describe("billing contracts", () => {
  it("rejects client-supplied prices", () => {
    expect(CreateBillingOrderSchema.safeParse({ productCode: "STUDIO_PLUS", amount: 1 }).success).toBe(false);
    expect(CreateBillingSubscriptionSchema.safeParse({ planCode: "STUDIO_PRO_MONTHLY", amount: 1 }).success).toBe(false);
  });

  it("rejects unknown products", () => {
    expect(CreateBillingOrderSchema.safeParse({ productCode: "STUDIO_PRO" }).success).toBe(false);
  });

  it("validates captured webhook entity fields", () => {
    expect(RazorpayWebhookSchema.safeParse({ event: "payment.captured", payload: { payment: { entity: { id: "pay_abc", amount: 199900, currency: "INR", status: "captured", order_id: "order_abc", created_at: 1 } } } }).success).toBe(true);
  });
});
