import { z } from "zod";

import { IsoDateTimeSchema } from "./common";

export const WebhookProviderSchema = z.enum([
  "MSG91",
  "RESEND",
  "REMOVEBG",
  "FAL",
  "BILLING",
]);

export const WebhookSchema = z
  .object({
    provider: WebhookProviderSchema,
    externalId: z.string().trim().min(1).max(255),
    eventType: z.string().trim().min(1).max(120),
    occurredAt: IsoDateTimeSchema.optional(),
    payload: z.unknown(),
  })
  .strict();

export type Webhook = z.infer<typeof WebhookSchema>;
