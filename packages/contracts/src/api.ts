import { z } from "zod";

import { RequestIdSchema } from "./common";

export const ApiErrorCodeSchema = z.enum([
  "BAD_REQUEST",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
  /**
   * The request was understood and permitted, but the tenant's plan does not
   * allow it. Distinct from CONFLICT so a client can offer an upgrade rather
   * than a retry.
   */
  "BATCH_LIMIT_EXCEEDED",
  "ALLOWANCE_EXHAUSTED",
]);

export const ApiErrorSchema = z
  .object({
    error: z
      .object({
        code: ApiErrorCodeSchema,
        message: z.string().trim().min(1).max(500),
        requestId: RequestIdSchema,
        fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
      })
      .strict(),
  })
  .strict();

export const IdempotencyKeySchema = z
  .string()
  .trim()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
