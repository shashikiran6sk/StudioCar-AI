import { z } from "zod";

/**
 * The administrative actions the activity trail knows how to describe.
 *
 * A closed set: an entry whose action is not here is still shown, but as a
 * plain statement of what happened rather than an invented sentence.
 */
export const AdministrativeActionSchema = z.enum([
  "INITIAL_ADMIN_BOOTSTRAPPED",
  "ADMIN_GRANTED",
  "ADMIN_REVOKED",
  "ADMIN_INVITED",
  "ADMIN_INVITATION_REVOKED",
  "PLAN_CONFIG_UPDATED",
  "SUBSCRIPTION_ASSIGNED",
  "ADMIN_CREDIT_GRANTED",
  "SUBSCRIPTION_REVOKED",
  "SOCIAL_LINK_SAVED",
  "SOCIAL_LINK_REMOVED",
]);

/**
 * What an audit entry's metadata may contain, once validated.
 *
 * Metadata is stored as `Json`, so it arrives as `unknown` and is validated
 * before anything reads a field from it. Every key is optional: entries
 * written by an older version of the product must still render.
 */
export const AuditMetadataSchema = z
  .object({
    email: z.string().optional(),
    includedImages: z.number().optional(),
    maxImagesPerBatch: z.number().optional(),
    months: z.number().optional(),
    accountUserId: z.string().optional(),
    planKey: z.string().optional(),
    priceMinorUnits: z.number().optional(),
    url: z.string().optional(),
  })
  .loose();

/** Bounded so the overview can never become an unpaged dump of the trail. */
export const AUDIT_ACTIVITY_LIMIT = 25;

export type AdministrativeAction = z.infer<typeof AdministrativeActionSchema>;
export type AuditMetadata = z.infer<typeof AuditMetadataSchema>;
