import type { PlanBillingInterval } from "@studiocar/contracts";

export interface PlanBillingIntervalOption {
  label: string;
  value: PlanBillingInterval;
}

export const PLAN_BILLING_INTERVAL_OPTIONS: readonly PlanBillingIntervalOption[] =
  [
    { label: "Not charged", value: "NONE" },
    { label: "One-time purchase", value: "ONE_TIME" },
    { label: "Every month", value: "MONTHLY" },
  ];
