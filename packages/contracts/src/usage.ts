import { z } from "zod";

import { CursorPaginationSchema } from "./common";

export const UsageEventTypeSchema = z.enum([
  "BACKGROUND_REMOVAL_COMPLETED",
]);

export const BillingPeriodKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected a YYYY-MM billing period.");

export const UsageQuerySchema = CursorPaginationSchema.extend({
  billingPeriodKey: BillingPeriodKeySchema.optional(),
  type: UsageEventTypeSchema.optional(),
}).strict();

export type UsageEventType = z.infer<typeof UsageEventTypeSchema>;
export type UsageQuery = z.infer<typeof UsageQuerySchema>;
