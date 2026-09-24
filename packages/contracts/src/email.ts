import { z } from "zod";

import { EntityIdSchema, RequestIdSchema } from "./common";

export const EmailWorkerMessageSchema = z
  .object({
    data: z
      .object({
        /**
         * Any http(s) address. `z.httpUrl()` also demands a public dotted
         * hostname, which refused every Local and Development link built from
         * http://localhost:3000, so no local completion email could ever be
         * published. Production's https public origin is enforced where
         * APPLICATION_BASE_URL is validated.
         */
        portfolioUrl: z.url({ protocol: /^https?$/ }),
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
