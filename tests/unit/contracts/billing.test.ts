import { describe, expect, it } from "vitest";
import { CreateBillingOrderSchema, VerifyBillingOrderSchema, RazorpayWebhookSchema } from "../../../packages/contracts/src/billing";
describe("Plus-only billing contracts", () => {
  it("accepts only the server-selected product without client pricing", () => {
    expect(CreateBillingOrderSchema.safeParse({ productCode: "STUDIO_PLUS" }).success).toBe(true);
    expect(CreateBillingOrderSchema.safeParse({ productCode: "STUDIO_PLUS", amount: 1, credits: 999 }).success).toBe(false);
    expect(CreateBillingOrderSchema.safeParse({ productCode: "STUDIO_PRO" }).success).toBe(false);
  });
  it("requires a valid signature and every payment field", () => {
    expect(VerifyBillingOrderSchema.safeParse({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "0".repeat(64) }).success).toBe(true);
    expect(RazorpayWebhookSchema.safeParse({ event: "payment.captured", payload: {} }).success).toBe(false);
    expect(RazorpayWebhookSchema.safeParse({ event: "subscription.charged", payload: {} }).success).toBe(false);
    expect(RazorpayWebhookSchema.safeParse({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 199900, currency: "INR", status: "authorized", created_at: 1 } } } }).success).toBe(false);
  });
});
