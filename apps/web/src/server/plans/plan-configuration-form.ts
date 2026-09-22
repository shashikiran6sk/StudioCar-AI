import {
  PlanBillingIntervalSchema,
  PlanConfigurationUpdateSchema,
  PLAN_FEATURE_MAX_COUNT,
  PLAN_FEATURE_MAX_LENGTH,
} from "@studiocar/contracts";
import { z } from "zod";

import {
  BYTES_PER_GIBIBYTE,
  PLAN_PRICE_MINOR_UNITS_PER_MAJOR,
} from "./plans.constants";

/** An unchecked box is absent from the submission rather than `false`. */
const FormCheckboxSchema = z
  .string()
  .nullable()
  .transform((value) => value !== null);

const FormTextSchema = z.string();

const FormIntegerSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform((value) => Number.parseInt(value, 10));

/** Blank means "not limited", which the database stores as null. */
const FormOptionalIntegerSchema = z
  .string()
  .nullable()
  .transform((value) => (value === null || value.trim() === "" ? null : value))
  .pipe(FormIntegerSchema.nullable());

/** A textarea, one feature per line, with blank lines discarded. */
const FormFeatureLinesSchema = z
  .string()
  .transform((value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  )
  .pipe(
    z
      .array(z.string().max(PLAN_FEATURE_MAX_LENGTH))
      .max(PLAN_FEATURE_MAX_COUNT),
  );

/**
 * Reads a plan edit out of a form submission.
 *
 * Prices are entered in rupees and storage in gibibytes, because that is what
 * an administrator thinks in; both are converted to the units the database
 * stores so no rounded float ever reaches a charge. The result is validated by
 * the canonical contract, which the database's own CHECK constraints mirror.
 */
export const PlanConfigurationFormSchema = z
  .object({
    active: FormCheckboxSchema,
    billingInterval: FormTextSchema.pipe(PlanBillingIntervalSchema),
    description: FormTextSchema,
    displayName: FormTextSchema,
    displayOrder: FormIntegerSchema,
    featured: FormCheckboxSchema,
    features: FormFeatureLinesSchema,
    includedImages: FormIntegerSchema,
    maxImagesPerBatch: FormIntegerSchema,
    priceRupees: FormIntegerSchema,
    purchasable: FormCheckboxSchema,
    segment: FormTextSchema,
    storageGigabytes: FormOptionalIntegerSchema,
  })
  .transform((form) => ({
    active: form.active,
    billingInterval: form.billingInterval,
    description: form.description.trim(),
    displayName: form.displayName.trim(),
    displayOrder: form.displayOrder,
    featured: form.featured,
    features: form.features,
    includedImages: form.includedImages,
    maxImagesPerBatch: form.maxImagesPerBatch,
    priceMinorUnits: form.priceRupees * PLAN_PRICE_MINOR_UNITS_PER_MAJOR,
    purchasable: form.purchasable,
    segment: form.segment.trim(),
    storageBytes:
      form.storageGigabytes === null
        ? null
        : form.storageGigabytes * BYTES_PER_GIBIBYTE,
  }))
  .pipe(PlanConfigurationUpdateSchema);

/** The raw text of a plan submission, before any of it is trusted. */
export interface PlanConfigurationFormInput {
  active: string | null;
  billingInterval: string | null;
  description: string | null;
  displayName: string | null;
  displayOrder: string | null;
  featured: string | null;
  features: string | null;
  includedImages: string | null;
  maxImagesPerBatch: string | null;
  priceRupees: string | null;
  purchasable: string | null;
  segment: string | null;
  storageGigabytes: string | null;
}

/**
 * Narrows a submission to the fields a plan edit is made of.
 *
 * An uploaded file where a price should be is not a price, so anything that is
 * not a string becomes absent rather than being coerced into one.
 */
export function readPlanConfigurationForm(
  formData: FormData,
): PlanConfigurationFormInput {
  const read = (field: keyof PlanConfigurationFormInput): string | null => {
    const value = formData.get(field);
    return typeof value === "string" ? value : null;
  };

  return {
    active: read("active"),
    billingInterval: read("billingInterval"),
    description: read("description"),
    displayName: read("displayName"),
    displayOrder: read("displayOrder"),
    featured: read("featured"),
    features: read("features"),
    includedImages: read("includedImages"),
    maxImagesPerBatch: read("maxImagesPerBatch"),
    priceRupees: read("priceRupees"),
    purchasable: read("purchasable"),
    segment: read("segment"),
    storageGigabytes: read("storageGigabytes"),
  };
}
