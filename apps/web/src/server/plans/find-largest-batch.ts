import type { PlanCatalogEntry } from "@studiocar/contracts";

/**
 * The largest batch any plan currently on offer allows, or null when nothing is
 * on offer.
 *
 * Deactivated plans are ignored: the interface should never invite somebody to
 * upgrade to a plan they cannot choose.
 */
export function findLargestBatch(
  catalog: readonly PlanCatalogEntry[],
): number | null {
  const offered = catalog.filter((plan) => plan.active);
  if (offered.length === 0) return null;
  return Math.max(...offered.map((plan) => plan.maxImagesPerBatch));
}
