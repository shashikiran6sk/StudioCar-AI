import type { PlanKey } from "@studiocar/contracts";

/** Falls back to this plan when a subscription names one that no longer exists. */
export const FALLBACK_PLAN_KEY: PlanKey = "FREE";

export const PLAN_CONFIG_LOCK_KEY = "plan-configuration";

export const AUDIT_RESOURCE_PLAN_CONFIG = "PlanConfig";
export const AUDIT_ACTION_PLAN_CONFIG_UPDATED = "PLAN_CONFIG_UPDATED";

/** Locale and currency used to render every price in the catalog. */
export const PLAN_PRICE_LOCALE = "en-IN";
export const PLAN_PRICE_MINOR_UNITS_PER_MAJOR = 100;

export const PLAN_CADENCE_LABELS = {
  NONE: "forever",
  ONE_TIME: "one-time",
  MONTHLY: "/ month",
} as const;

export const PLAN_FREE_ACTION_LABEL = "Start free";
/** `Choose Studio Plus`, `Choose Studio Pro`, and so on. */
export const PLAN_PAID_ACTION_PREFIX = "Choose";

/** One gibibyte: plan storage is entered in GB and stored in bytes. */
export const BYTES_PER_GIBIBYTE = 1_073_741_824;
