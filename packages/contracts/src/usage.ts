import { z } from "zod";

import { CursorPaginationSchema } from "./common";

export const UsageEventTypeSchema = z.enum([
  "BACKGROUND_REMOVAL_COMPLETED",
  "VEHICLE_PROCESSING_BATCH_CREATED",
]);

export const BillingPeriodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected a YYYY-MM billing period.");

export const UsageQuerySchema = CursorPaginationSchema.extend({
  billingPeriodKey: BillingPeriodKeySchema.optional(),
  type: UsageEventTypeSchema.optional(),
}).strict();

export const PlanKeySchema = z.enum([
  "FREE",
  "STUDIO_PACK",
  "STUDIO_PRO",
  "STUDIO_PLUS",
]);

/**
 * `LIFETIME` allowances never refill; `BILLING_PERIOD` allowances refill each
 * calendar month.
 */
export const PlanAllowanceScopeSchema = z.enum([
  "LIFETIME",
  "BILLING_PERIOD",
]);

export const UsageBillingSummarySchema = z
  .object({
    currentPlan: z
      .object({
        allowanceScope: PlanAllowanceScopeSchema,
        description: z.string().min(1),
        imageCapacity: z.number().int().positive(),
        key: PlanKeySchema,
        maxImagesPerBatch: z.number().int().positive(),
        name: z.string().min(1),
        storageCapacityBytes: z.number().int().positive().nullable(),
        uploadSessionCapacity: z.number().int().positive().nullable(),
      })
      .strict(),
    imagesRemaining: z.number().int().nonnegative(),
    imagesUsed: z.number().int().nonnegative(),
    storageUsedBytes: z.number().int().nonnegative(),
    uploadSessionsRemaining: z.number().int().nonnegative().nullable(),
    uploadSessionsUsed: z.number().int().nonnegative(),
  })
  .strict();

export type UsageEventType = z.infer<typeof UsageEventTypeSchema>;
export type UsageQuery = z.infer<typeof UsageQuerySchema>;
export type PlanKey = z.infer<typeof PlanKeySchema>;
export type PlanAllowanceScope = z.infer<typeof PlanAllowanceScopeSchema>;
export type UsageBillingSummary = z.infer<typeof UsageBillingSummarySchema>;
