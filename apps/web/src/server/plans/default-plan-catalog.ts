import type { PlanCatalogEntry } from "@studiocar/contracts";

import {
  DEFAULT_PLAN_CONFIGURATIONS,
  FREE_PLAN_DEFAULT,
  type DefaultPlanConfiguration,
} from "./default-plan-configurations";

function toCatalogEntry(plan: DefaultPlanConfiguration): PlanCatalogEntry {
  return { ...plan, features: [...plan.features] };
}

/**
 * The shipped catalog, in the same shape the database produces.
 *
 * It is the last resort, not the source of truth: it keeps pricing and
 * allowances correct on a database that has not been seeded yet, and keeps the
 * application serving if the plan table cannot be read.
 */
export const DEFAULT_PLAN_CATALOG: readonly PlanCatalogEntry[] =
  DEFAULT_PLAN_CONFIGURATIONS.map(toCatalogEntry);

/** The entry every lookup falls back to when no other plan matches. */
export const FALLBACK_PLAN_ENTRY: PlanCatalogEntry =
  toCatalogEntry(FREE_PLAN_DEFAULT);
