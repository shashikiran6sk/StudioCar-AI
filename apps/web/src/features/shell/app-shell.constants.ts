export const WORKSPACE_LABEL = "Workspace";
export const SIDEBAR_PLAN_NAME_SUFFIX = "plan";
export const SIDEBAR_PLAN_IMAGES_USED_SUFFIX = "images used";
export const SIDEBAR_PLAN_STORAGE_SEPARATOR = "of";
export const SIDEBAR_PLAN_USAGE_LABEL = "stored";
export const SIDEBAR_PLAN_FALLBACK_HEADING = "Your workspace";
export const SIDEBAR_PLAN_FALLBACK_DESCRIPTION =
  "Plan and usage details are available from Packs & Billing.";

/**
 * Used only when the server could not resolve a plan. Deliberately the smallest
 * allowance, so a failure never lets someone start work the server will refuse.
 */
export const DEFAULT_MAX_IMAGES_PER_BATCH = 5;
