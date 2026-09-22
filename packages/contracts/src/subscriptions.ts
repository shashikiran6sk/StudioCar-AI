import { z } from "zod";

import { IndianPhoneNumberSchema } from "./phone-number";
import { PlanKeySchema } from "./usage";

/**
 * Normalised before it is validated.
 *
 * `z.email()` checks the format first, so trimming afterwards would reject an
 * address that only had a stray space around it.
 */
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** Matches `PlanSubscription.note`'s column width. */
export const SUBSCRIPTION_NOTE_MAX_LENGTH = 500;
/** A manual subscription is a stopgap, not an open-ended grant. */
export const MANUAL_SUBSCRIPTION_MIN_MONTHS = 1;
export const MANUAL_SUBSCRIPTION_MAX_MONTHS = 24;

/**
 * How an administrator finds the account a subscription belongs to.
 *
 * Exact match on a **verified** contact only. There is no partial search and
 * no listing: an administrator assigning a subscription already knows who they
 * are assigning it to, and a browsable directory of customers would be a
 * larger disclosure than the task needs.
 */
export const AccountLookupSchema = z
  .union([
    z.object({ email: EmailSchema }).strict(),
    z.object({ phoneNumber: IndianPhoneNumberSchema }).strict(),
  ])
  .describe("An exact verified email address or Indian mobile number.");

/**
 * The plan an administrator hands out by hand, until a billing provider exists.
 *
 * `FREE` is absent on purpose: it is the absence of a subscription, so
 * "assigning" it would create a row that means nothing.
 */
export const ManualSubscriptionPlanKeySchema = PlanKeySchema.exclude(["FREE"]);

export const ManualSubscriptionAssignmentSchema = z
  .object({
    months: z
      .number()
      .int()
      .min(MANUAL_SUBSCRIPTION_MIN_MONTHS)
      .max(MANUAL_SUBSCRIPTION_MAX_MONTHS),
    note: z.string().trim().max(SUBSCRIPTION_NOTE_MAX_LENGTH).optional(),
    planKey: ManualSubscriptionPlanKeySchema,
    /** Ownership is keyed by account, never by an email or a phone number. */
    userId: z.uuid(),
  })
  .strict();

export type AccountLookup = z.infer<typeof AccountLookupSchema>;
export type ManualSubscriptionPlanKey = z.infer<
  typeof ManualSubscriptionPlanKeySchema
>;
export type ManualSubscriptionAssignment = z.infer<
  typeof ManualSubscriptionAssignmentSchema
>;
