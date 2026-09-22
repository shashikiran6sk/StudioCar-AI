import type {
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

export interface UsageBillingRepositoryPort {
  getOwnedSummary(
    userId: string,
    billingPeriodKey: string,
    now: Date,
  ): Promise<UsageBillingRepositoryRecord>;
}

export interface UsageBillingApplication {
  getSummary(userId: string, now?: Date): Promise<UsageBillingSummary>;
}
