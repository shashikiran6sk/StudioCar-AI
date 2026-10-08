import { PLUS_PRODUCT } from "@studiocar/contracts";
import type { PlanAllowanceScope, PlanBillingInterval } from "@studiocar/contracts";


export interface DefaultPlanConfiguration {
  planKey: string;
  displayName: string;
  description: string;
  segment: string;
  active: boolean;
  purchasable: boolean;
  featured: boolean;
  /** Minor units, so ₹5,499 is 549900 paise and never a float. */
  priceMinorUnits: number;
  currency: string;
  billingInterval: PlanBillingInterval;
  allowanceScope: PlanAllowanceScope;
  includedImages: number;
  maxImagesPerBatch: number;
  storageBytes: number | null;
  features: readonly string[];
  displayOrder: number;
}

/**
 * The plan every account starts on, and the one the application falls back to
 * when a entitlement names a plan that no longer exists.
 *
 * It is named separately so that fallback is a direct reference rather than a
 * lookup that could return nothing.
 */
export const FREE_PLAN_DEFAULT: DefaultPlanConfiguration = {
  planKey: "FREE",
  displayName: "Free",
  description:
    "For individuals trying the StudioCar workflow on a small set of vehicles.",
  segment: "Explore",
  active: true,
  purchasable: false,
  featured: false,
  priceMinorUnits: 0,
  currency: "INR",
  billingInterval: "NONE",
  allowanceScope: "LIFETIME",
  includedImages: 15,
  maxImagesPerBatch: 5,
  storageBytes: 3_221_225_472,
  features: [
    "15 images in total",
    "Maximum 5 images per batch",
    "Standard background processing",
    "3 GB storage",
  ],
  displayOrder: 0,
};

const STUDIO_PLUS_PLAN_DEFAULT: DefaultPlanConfiguration = {
  planKey: PLUS_PRODUCT.code,
  displayName: PLUS_PRODUCT.name,
  description:
    "A flexible credit pack for sellers, photographers, and growing dealerships.",
  segment: "Most popular",
  active: true,
  purchasable: true,
  featured: true,
  priceMinorUnits: PLUS_PRODUCT.amountPaise,
  currency: "INR",
  billingInterval: "ONE_TIME",
  allowanceScope: "LIFETIME",
  includedImages: PLUS_PRODUCT.credits,
  maxImagesPerBatch: 20,
  storageBytes: null,
  features: [
    "100 image credits",
    "Up to 20 images per batch",
    "Premium studio backgrounds",
    "Credits never expire",
    "Buy additional credits at any time",
  ],
  displayOrder: 1,
};


/**
 * The canonical plan catalog.
 *
 * These are defaults, not the source of truth: once seeded, `PlanConfig` rows
 * are authoritative and administrators change them without a deployment. They
 * remain here so a missing row can never take the application down, and so a
 * fresh database has something correct to start from.
 *
 * Paid plans are purchasable through the server-side Razorpay billing service.
 */
export const DEFAULT_PLAN_CONFIGURATIONS: readonly DefaultPlanConfiguration[] =
  [
    FREE_PLAN_DEFAULT,
    STUDIO_PLUS_PLAN_DEFAULT,
  ];
