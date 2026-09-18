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

export type WorkerMessage = z.infer<typeof WorkerMessageSchema>;
