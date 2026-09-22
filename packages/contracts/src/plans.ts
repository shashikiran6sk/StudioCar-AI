import { z } from "zod";

import { PlanAllowanceScopeSchema } from "./usage";

/**
 * How often a plan is charged.
 *
 * `NONE` is a plan nobody pays for, `ONE_TIME` a credit pack bought outright,
 * and `MONTHLY` a recurring subscription.
 */
export const PlanBillingIntervalSchema = z.enum([
  "NONE",
  "ONE_TIME",
  "MONTHLY",
]);

/** Matches `PlanConfig.displayName`'s column width. */
export const PLAN_DISPLAY_NAME_MAX_LENGTH = 80;
/** Matches `PlanConfig.description`'s column width. */
export const PLAN_DESCRIPTION_MAX_LENGTH = 500;
/** Matches `PlanConfig.segment`'s column width. */
export const PLAN_SEGMENT_MAX_LENGTH = 80;
export const PLAN_FEATURE_MAX_LENGTH = 120;
export const PLAN_FEATURE_MAX_COUNT = 10;
/** ₹100,000,000 in paise: far above any real price, below `Int` overflow. */
export const PLAN_PRICE_MINOR_UNITS_MAX = 10_000_000_000;
export const PLAN_INCLUDED_IMAGES_MAX = 1_000_000;
export const PLAN_DISPLAY_ORDER_MAX = 999;
/** 1 TiB, an upper bound no plan should quietly exceed by a typing slip. */
export const PLAN_STORAGE_BYTES_MAX = 1_099_511_627_776;

const PlanTextSchema = (maximum: number) =>
  z.string().trim().min(1).max(maximum);

/**
 * One plan as the application reads it, whether it came from the database or
 * from the shipped defaults.
 */
export const PlanCatalogEntrySchema = z
  .object({
    active: z.boolean(),
    allowanceScope: PlanAllowanceScopeSchema,
    billingInterval: PlanBillingIntervalSchema,
    currency: z.string().length(3),
    description: PlanTextSchema(PLAN_DESCRIPTION_MAX_LENGTH),
    displayName: PlanTextSchema(PLAN_DISPLAY_NAME_MAX_LENGTH),
    displayOrder: z.number().int().min(0).max(PLAN_DISPLAY_ORDER_MAX),
    featured: z.boolean(),
    features: z
      .array(PlanTextSchema(PLAN_FEATURE_MAX_LENGTH))
      .max(PLAN_FEATURE_MAX_COUNT),
    includedImages: z.number().int().positive().max(PLAN_INCLUDED_IMAGES_MAX),
    maxImagesPerBatch: z
      .number()
      .int()
      .positive()
      .max(PLAN_INCLUDED_IMAGES_MAX),
    planKey: z.string().min(1).max(PLAN_DISPLAY_NAME_MAX_LENGTH),
    priceMinorUnits: z
      .number()
      .int()
      .nonnegative()
      .max(PLAN_PRICE_MINOR_UNITS_MAX),
    purchasable: z.boolean(),
    segment: PlanTextSchema(PLAN_SEGMENT_MAX_LENGTH),
    storageBytes: z
      .number()
      .int()
      .positive()
      .max(PLAN_STORAGE_BYTES_MAX)
      .nullable(),
  })
  .strict();

/**
 * What an administrator may change about a plan.
 *
 * `planKey` and `allowanceScope` are deliberately absent. The key identifies
 * existing subscriptions and the scope decides how an allowance is counted, so
 * editing either would silently reinterpret usage already charged.
 */
export const PlanConfigurationUpdateSchema = PlanCatalogEntrySchema.omit({
  allowanceScope: true,
  currency: true,
  planKey: true,
})
  .strict()
  .refine(
    (plan) => plan.maxImagesPerBatch <= plan.includedImages,
    {
      error: "A batch cannot be larger than the plan's total allowance.",
      path: ["maxImagesPerBatch"],
    },
  );

export type PlanBillingInterval = z.infer<typeof PlanBillingIntervalSchema>;
export type PlanCatalogEntry = z.infer<typeof PlanCatalogEntrySchema>;
export type PlanConfigurationUpdate = z.infer<
  typeof PlanConfigurationUpdateSchema
>;
