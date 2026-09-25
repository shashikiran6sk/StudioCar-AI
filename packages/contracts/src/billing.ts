import { z } from "zod";

const RazorpayIdentifierSchema = z.string().regex(/^[a-z]+_[A-Za-z0-9]+$/);
const RazorpaySignatureSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const CreateBillingOrderSchema = z.object({
  productCode: z.literal("STUDIO_PLUS"),
}).strict();

export const CreateBillingSubscriptionSchema = z.object({
  planCode: z.literal("STUDIO_PRO_MONTHLY"),
}).strict();

export const VerifyBillingOrderSchema = z.object({
  razorpay_payment_id: RazorpayIdentifierSchema,
  razorpay_order_id: RazorpayIdentifierSchema,
  razorpay_signature: RazorpaySignatureSchema,
}).strict();

export const VerifyBillingSubscriptionSchema = z.object({
  razorpay_payment_id: RazorpayIdentifierSchema,
  razorpay_subscription_id: RazorpayIdentifierSchema,
  razorpay_signature: RazorpaySignatureSchema,
}).strict();

export const RazorpayPaymentEntitySchema = z.object({
  id: RazorpayIdentifierSchema,
  amount: z.number().int().positive(),
  currency: z.literal("INR"),
  status: z.string(),
  order_id: RazorpayIdentifierSchema.nullish(),
  subscription_id: RazorpayIdentifierSchema.nullish(),
  method: z.string().nullish(),
  created_at: z.number().int().nonnegative(),
});

export const RazorpaySubscriptionEntitySchema = z.object({
  id: RazorpayIdentifierSchema,
  plan_id: RazorpayIdentifierSchema,
  status: z.string(),
  current_start: z.number().int().nonnegative().nullish(),
  current_end: z.number().int().nonnegative().nullish(),
  notes: z.union([
    z.object({ internalSubscriptionId: z.uuid().optional() }).loose(),
    z.array(z.unknown()),
  ]).optional(),
});

export const RazorpayRefundEntitySchema = z.object({
  id: RazorpayIdentifierSchema,
  payment_id: RazorpayIdentifierSchema,
  amount: z.number().int().positive(),
  status: z.string(),
});

export const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({ entity: RazorpayPaymentEntitySchema }).optional(),
    subscription: z.object({ entity: RazorpaySubscriptionEntitySchema }).optional(),
    refund: z.object({ entity: RazorpayRefundEntitySchema }).optional(),
  }),
});

export type CreateBillingOrder = z.infer<typeof CreateBillingOrderSchema>;
export type CreateBillingSubscription = z.infer<typeof CreateBillingSubscriptionSchema>;
export type VerifyBillingOrder = z.infer<typeof VerifyBillingOrderSchema>;
export type VerifyBillingSubscription = z.infer<typeof VerifyBillingSubscriptionSchema>;
export type RazorpayWebhook = z.infer<typeof RazorpayWebhookSchema>;
