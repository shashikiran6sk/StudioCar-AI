import type { PlanCatalogEntry } from "@studiocar/contracts";

import type { MarketingBatchLimits } from "./marketing-batch-limits.types";

/**
 * The batch sizes the homepage advertises, read from the plans on offer.
 *
 * The free figure is the free plan's own limit; the paid figure is the largest
 * any paid plan allows. Either is null when no such plan is offered, so the
 * page says nothing rather than repeat a number an administrator has changed.
 */
export function summarizeBatchLimits(
  catalog: readonly PlanCatalogEntry[],
): MarketingBatchLimits {
  const offered = catalog.filter((plan) => plan.active);
  const free = offered.filter((plan) => plan.priceMinorUnits === 0);
  const paid = offered.filter((plan) => plan.priceMinorUnits > 0);
  return {
    free:
      free.length === 0
        ? null
        : Math.max(...free.map((plan) => plan.maxImagesPerBatch)),
    paid:
      paid.length === 0
        ? null
        : Math.max(...paid.map((plan) => plan.maxImagesPerBatch)),
  };
}
