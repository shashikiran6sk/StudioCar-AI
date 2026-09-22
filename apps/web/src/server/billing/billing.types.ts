import type {
  PlanCatalogEntry,
  PlanKey,
  UsageBillingSummary,
} from "@studiocar/contracts";
import type { UsageBillingRepositoryRecord } from "../db/repositories/usage-billing-repository";

export interface BillingCheckoutRequest {
  planKey: Exclude<PlanKey, "FREE">;
  returnUrl: string;
  userId: string;
}

export interface BillingCheckout {
  checkoutUrl: string;
}

export interface BillingPort {
  createCheckout(request: BillingCheckoutRequest): Promise<BillingCheckout>;
  getSubscription(userId: string): Promise<PlanKey | null>;
}

/** The plans currently on offer, however they are configured. */
export interface PlanCatalogPort {
  list(): Promise<readonly PlanCatalogEntry[]>;
}

export interface UsageBillingRepositoryPort {
  findOwnedPlanKey(userId: string, now: Date): Promise<string | null>;
  getOwnedSummary(
    userId: string,
    billingPeriodKey: string | null,
    now: Date,
  ): Promise<UsageBillingRepositoryRecord>;
}

export interface UsageBillingApplication {
  getSummary(userId: string, now?: Date): Promise<UsageBillingSummary>;
}
