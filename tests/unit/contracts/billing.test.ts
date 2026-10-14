import { describe, expect, it } from "vitest";
import { PaymentHistoryEntrySchema, CreateBillingOrderSchema, VerifyBillingOrderSchema, RazorpayWebhookSchema } from "../../../packages/contracts/src/billing";
describe("Plus-only billing contracts", () => {
  it("rejects malformed or expanded payment history DTOs", () => {
    const payment = { id: "0f600bc6-7c7f-44c8-91ed-4b5b90c9c789", createdAt: "2026-10-08T00:00:00.000Z", paidAt: null,
      productCode: "STUDIO_PLUS", amountPaise: 199900, currency: "INR", status: "CREATED", razorpayOrderId: null, razorpayPaymentId: null };
    expect(PaymentHistoryEntrySchema.safeParse(payment).success).toBe(true);
    expect(PaymentHistoryEntrySchema.safeParse({ ...payment, amountPaise: -1 }).success).toBe(false);
    expect(PaymentHistoryEntrySchema.safeParse({ ...payment, status: "unknown" }).success).toBe(false);
    expect(PaymentHistoryEntrySchema.safeParse({ ...payment, userId: "private-owner" }).success).toBe(false);
  });
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
