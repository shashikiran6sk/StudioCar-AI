import { z } from "zod";

import { EntityIdSchema, RequestIdSchema } from "./common";

export const EmailWorkerMessageSchema = z
  .object({
    data: z
      .object({
        portfolioUrl: z.httpUrl(),
        vehicleName: z.string().trim().min(1).max(120),
      })
      .strict(),
    messageId: EntityIdSchema,
    recipient: z.email(),
    requestId: RequestIdSchema.optional(),
    type: z.literal("PROCESSING_COMPLETED"),
    version: z.literal(1),
  })
  .strict();

export type EmailWorkerMessage = z.infer<typeof EmailWorkerMessageSchema>;
