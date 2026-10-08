import { z } from "zod";

export const PLUS_PRODUCT = Object.freeze({
  code: "STUDIO_PLUS", name: "StudioCar Plus", amountPaise: 199_900,
  currency: "INR", credits: 100,
} satisfies { code: "STUDIO_PLUS"; name: string; amountPaise: number; currency: "INR"; credits: number });

const RazorpayIdentifierSchema = z.string().regex(/^[a-z]+_[A-Za-z0-9]+$/).max(255);
const RazorpaySignatureSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const CreateBillingOrderSchema = z.object({ productCode: z.literal(PLUS_PRODUCT.code) }).strict();
export const VerifyBillingOrderSchema = z.object({
  razorpay_payment_id: RazorpayIdentifierSchema,
  razorpay_order_id: RazorpayIdentifierSchema,
  razorpay_signature: RazorpaySignatureSchema,
}).strict();
export const BillingOrderResponseSchema = z.object({
  orderId: RazorpayIdentifierSchema, keyId: z.string(), amount: z.number().int().positive(),
  currency: z.literal(PLUS_PRODUCT.currency), name: z.string(),
});
export const BillingStatusSchema = z.object({
  purchasedCredits: z.number().int().nonnegative(),
  purchasedCreditsGranted: z.number().int().nonnegative(),
  checkoutPaymentStatus: z.enum(["CREATED", "VERIFIED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).nullable(),
});
export const BillingStatusQuerySchema = z.object({ orderId: z.string().regex(/^order_[A-Za-z0-9]+$/).max(255).optional() }).strict();
export const RazorpayPaymentEntitySchema = z.object({
  id: RazorpayIdentifierSchema,
  amount: z.number().int().positive(), currency: z.string().length(3), status: z.string(),
  order_id: RazorpayIdentifierSchema,
  method: z.string().max(40).nullish(), created_at: z.number().int().nonnegative(),
});
export const RazorpayRefundEntitySchema = z.object({
  id: RazorpayIdentifierSchema, payment_id: RazorpayIdentifierSchema,
  amount: z.number().int().positive(), status: z.enum(["pending", "processed", "failed"]),
});
export const RazorpayWebhookSchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("payment.captured"), payload: z.object({ payment: z.object({ entity: RazorpayPaymentEntitySchema.extend({ status: z.literal("captured") }) }) }) }),
  z.object({ event: z.literal("payment.failed"), payload: z.object({ payment: z.object({ entity: RazorpayPaymentEntitySchema.extend({ status: z.literal("failed") }) }) }) }),
  z.object({ event: z.enum(["refund.created", "refund.processed", "refund.failed"]), payload: z.object({ refund: z.object({ entity: RazorpayRefundEntitySchema }) }) }),
]);
export type CreateBillingOrder = z.infer<typeof CreateBillingOrderSchema>;
export type VerifyBillingOrder = z.infer<typeof VerifyBillingOrderSchema>;
export type RazorpayWebhook = z.infer<typeof RazorpayWebhookSchema>;
