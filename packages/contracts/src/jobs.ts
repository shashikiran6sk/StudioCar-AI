import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "./common";
import { ProcessingOptionsSchema } from "./processing";

export const MAX_PROCESSING_BATCH_ASSETS = 20;

export const JobStateSchema = z.enum([
  "CREATED",
  "QUEUED",
  "PROCESSING",
  "RETRYING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const ProcessingStageSchema = z.enum([
  "UPLOADING",
  "QUEUED",
  "REMOVING_BACKGROUND",
  "FINALIZING",
  "COMPLETE",
]);

const JobStatusBaseSchema = z.object({
  jobId: EntityIdSchema,
  assetId: EntityIdSchema,
  vehicleId: EntityIdSchema,
  vehicleName: z.string().trim().min(1).max(120),
  updatedAt: IsoDateTimeSchema,
});

export const JobStatusSchema = z.discriminatedUnion("state", [
  JobStatusBaseSchema.extend({
    state: z.literal("CREATED"),
    stage: z.literal("UPLOADING"),
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("QUEUED"),
    stage: z.literal("QUEUED"),
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("PROCESSING"),
    stage: z.enum(["REMOVING_BACKGROUND", "FINALIZING"]),
    providerProgressPercent: z.number().min(0).max(100).optional(),
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("RETRYING"),
    stage: z.enum(["QUEUED", "REMOVING_BACKGROUND"]),
    nextAttemptAt: IsoDateTimeSchema.optional(),
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("COMPLETED"),
    stage: z.literal("COMPLETE"),
    processedAssetId: EntityIdSchema,
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("FAILED"),
    stage: z.enum(["QUEUED", "REMOVING_BACKGROUND", "FINALIZING"]),
    errorCode: z.string().trim().min(1).max(80),
    retryable: z.boolean(),
  }).strict(),
  JobStatusBaseSchema.extend({
    state: z.literal("CANCELLED"),
    stage: z.enum(["UPLOADING", "QUEUED", "REMOVING_BACKGROUND", "FINALIZING"]),
  }).strict(),
]);

export const JobStatusQuerySchema = z
  .object({
    ids: z
      .array(EntityIdSchema)
      .min(1)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, "Job IDs must be unique."),
  })
  .strict();

export const JobStatusResponseSchema = z
  .object({ jobs: z.array(JobStatusSchema).max(100) })
  .strict();

export const CreateProcessingBatchSchema = z
  .object({
    vehicleId: EntityIdSchema,
    assetIds: z
      .array(EntityIdSchema)
      .min(1)
      .max(MAX_PROCESSING_BATCH_ASSETS)
      .refine(
        (assetIds) => new Set(assetIds).size === assetIds.length,
        "Asset IDs must be unique.",
      ),
    options: ProcessingOptionsSchema,
  })
  .strict();

export const ProcessingJobReservationSchema = z
  .object({
    jobId: EntityIdSchema,
    assetId: EntityIdSchema,
    state: JobStateSchema,
  })
  .strict();

export const CreateProcessingBatchResponseSchema = z
  .object({
    jobs: z.array(ProcessingJobReservationSchema).min(1),
    replayed: z.boolean(),
  })
  .strict();

export type JobState = z.infer<typeof JobStateSchema>;
export type ProcessingStage = z.infer<typeof ProcessingStageSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobStatusQuery = z.infer<typeof JobStatusQuerySchema>;
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;
export type CreateProcessingBatch = z.infer<
  typeof CreateProcessingBatchSchema
>;
export type ProcessingJobReservation = z.infer<
  typeof ProcessingJobReservationSchema
>;
export type CreateProcessingBatchResponse = z.infer<
  typeof CreateProcessingBatchResponseSchema
>;
