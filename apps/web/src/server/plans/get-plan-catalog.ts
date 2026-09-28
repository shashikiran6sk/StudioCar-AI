import type { PlanCatalogEntry } from "@studiocar/contracts";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { DEFAULT_PLAN_CATALOG } from "./default-plan-catalog";
import { getPlanConfigRepository } from "./plan-config-runtime";
import { PUBLIC_PLAN_CATALOG_CACHE_TAG } from "./plans.constants";
import { toPlanCatalogEntry } from "./to-plan-catalog-entry";

async function readActivePlanCatalog(): Promise<readonly PlanCatalogEntry[]> {
  const configured = await getPlanConfigRepository().findActive();
  return configured.length === 0
    ? DEFAULT_PLAN_CATALOG
    : configured.map(toPlanCatalogEntry);
}

/**
 * Reads the plans an administrator has configured.
 *
 * The result is memoised per request, not cached across requests: an allowance
 * decides whether somebody's work is charged or refused, so it is read fresh
 * from a single indexed query rather than served from a stale copy.
 *
 * The shipped defaults stand in when the table holds no active plan. That
 * covers a database that has not been seeded, and keeps the public pricing page
 * truthful rather than blank while the configuration is being set up.
 */
export const getPlanCatalog = cache(
  readActivePlanCatalog,
);

/**
 * Reads the catalog for the public pricing section through Next's
 * cross-request data cache. This stays separate from `getPlanCatalog`: billing
 * and allowance decisions must always read fresh configuration.
 */
const readCachedPublicPlanCatalog = unstable_cache(
  readActivePlanCatalog,
  ["public-plan-catalog"],
  { tags: [PUBLIC_PLAN_CATALOG_CACHE_TAG] },
);

export const getPublicPlanCatalog = cache(
  (): Promise<readonly PlanCatalogEntry[]> => readCachedPublicPlanCatalog(),
);

/** Every plan, including deactivated ones, for the administration editor. */
export const getFullPlanCatalog = cache(
  async (): Promise<readonly PlanCatalogEntry[]> => {
    const configured = await getPlanConfigRepository().findAll();
    return configured.length === 0
      ? DEFAULT_PLAN_CATALOG
      : configured.map(toPlanCatalogEntry);
  },
);
