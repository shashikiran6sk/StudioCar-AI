import type { PlanCatalogEntry } from "@studiocar/contracts";

import {
  BYTES_PER_GIBIBYTE,
  PLAN_PRICE_MINOR_UNITS_PER_MAJOR,
} from "../../server/plans/plans.constants";

/** A plan as the edit form shows it, in the units an administrator types. */
export interface PlanConfigurationFields {
  active: boolean;
  billingInterval: string;
  description: string;
  displayName: string;
  displayOrder: string;
  featured: boolean;
  features: string;
  includedImages: string;
  maxImagesPerBatch: string;
  planKey: string;
  priceRupees: string;
  purchasable: boolean;
  segment: string;
  storageGigabytes: string;
}

/**
 * Converts stored units into entered units.
 *
 * Storage that is not limited is shown blank rather than as a zero, because a
 * zero would read as "no storage at all".
 */
export function toPlanConfigurationFields(
  plan: PlanCatalogEntry,
): PlanConfigurationFields {
  return {
    active: plan.active,
    billingInterval: plan.billingInterval,
    description: plan.description,
    displayName: plan.displayName,
    displayOrder: String(plan.displayOrder),
    featured: plan.featured,
    features: plan.features.join("\n"),
    includedImages: String(plan.includedImages),
    maxImagesPerBatch: String(plan.maxImagesPerBatch),
    planKey: plan.planKey,
    priceRupees: String(
      plan.priceMinorUnits / PLAN_PRICE_MINOR_UNITS_PER_MAJOR,
    ),
    purchasable: plan.purchasable,
    segment: plan.segment,
    storageGigabytes:
      plan.storageBytes === null
        ? ""
        : String(plan.storageBytes / BYTES_PER_GIBIBYTE),
  };
}
