import type { PlanCatalogEntry } from "@studiocar/contracts";

import type { PlanConfigRecord } from "../db/repositories/plan-config-repository";
import { safeBigIntToNumber } from "../dashboard/safe-bigint-to-number";

/**
 * Turns a stored plan into the shape the application reads.
 *
 * `providerPriceId` is deliberately dropped: it is billing-provider plumbing,
 * not something a page or an allowance check has any use for.
 */
export function toPlanCatalogEntry(record: PlanConfigRecord): PlanCatalogEntry {
  return {
    active: record.active,
    allowanceScope: record.allowanceScope,
    billingInterval: record.billingInterval,
    currency: record.currency,
    description: record.description,
    displayName: record.displayName,
    displayOrder: record.displayOrder,
    featured: record.featured,
    features: [...record.features],
    includedImages: record.includedImages,
    maxImagesPerBatch: record.maxImagesPerBatch,
    planKey: record.planKey,
    priceMinorUnits: record.priceMinorUnits,
    purchasable: record.purchasable,
    segment: record.segment,
    storageBytes:
      record.storageBytes === null
        ? null
        : safeBigIntToNumber(record.storageBytes),
  };
}
