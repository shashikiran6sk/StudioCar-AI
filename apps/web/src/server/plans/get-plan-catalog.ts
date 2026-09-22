import type { PlanCatalogEntry } from "@studiocar/contracts";
import { cache } from "react";

import { DEFAULT_PLAN_CATALOG } from "./default-plan-catalog";
import { getPlanConfigRepository } from "./plan-config-runtime";
import { toPlanCatalogEntry } from "./to-plan-catalog-entry";

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
  async (): Promise<readonly PlanCatalogEntry[]> => {
    const configured = await getPlanConfigRepository().findActive();
    return configured.length === 0
      ? DEFAULT_PLAN_CATALOG
      : configured.map(toPlanCatalogEntry);
  },
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
