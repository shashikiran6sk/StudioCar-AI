import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema, RequestIdSchema } from "./common";

export const WorkerMessageSchema = z
  .object({
    version: z.literal(1),
    type: z.literal("PROCESS_IMAGE"),
    jobId: EntityIdSchema,
    requestId: RequestIdSchema.optional(),
    enqueuedAt: IsoDateTimeSchema,
  })
  .strict();

export const SqsWorkerRecordSchema = z.object({
  messageId: z.string().trim().min(1).max(255),
  body: z.string().min(1),
});

export const SqsWorkerEventSchema = z.object({
  Records: z.array(SqsWorkerRecordSchema).min(1).max(10),
});

export const SqsBatchItemFailureSchema = z
  .object({ itemIdentifier: z.string().trim().min(1).max(255) })
  .strict();

export const SqsBatchResponseSchema = z
  .object({
    batchItemFailures: z.array(SqsBatchItemFailureSchema),
  })
  .strict();

export type WorkerMessage = z.infer<typeof WorkerMessageSchema>;
export type SqsWorkerEvent = z.infer<typeof SqsWorkerEventSchema>;
export type SqsBatchResponse = z.infer<typeof SqsBatchResponseSchema>;
