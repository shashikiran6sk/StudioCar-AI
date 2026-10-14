import { z } from "zod";

import { AppEnvironmentSchema } from "./app-environment-schema";

export const RazorpayEnvironmentSchema = z
  .object({
    APP_ENV: AppEnvironmentSchema,
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  })
  .strip()
  .superRefine((value, context) => {
    const expected = value.APP_ENV === "production" ? "rzp_live_" : "rzp_test_";
    if (!value.RAZORPAY_KEY_ID.startsWith(expected)) {
      context.addIssue({
        code: "custom",
        path: ["RAZORPAY_KEY_ID"],
        message: `Invalid Razorpay configuration. ${value.APP_ENV} requires ${expected} credentials.`,
      });
    }
  });

export type RazorpayEnvironment = z.infer<typeof RazorpayEnvironmentSchema>;

export function parseRazorpayEnvironment(
  environment: Record<string, string | undefined>,
): RazorpayEnvironment {
  return RazorpayEnvironmentSchema.parse(environment);
}
