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
