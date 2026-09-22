import type { PlanCatalogEntry, PlanKey } from "@studiocar/contracts";

import { BillingPlanCard } from "./billing-plan-card";
import {
  USAGE_BILLING_PACKS_DESCRIPTION,
  USAGE_BILLING_PACKS_EYEBROW,
  USAGE_BILLING_PACKS_TITLE,
} from "./usage-billing.constants";

export interface BillingPlanGridProps {
  currentPlanKey: PlanKey;
  plans: readonly PlanCatalogEntry[];
}

export function BillingPlanGrid({
  currentPlanKey,
  plans,
}: BillingPlanGridProps) {
  return (
    <section className="billing-packs" id="packs">
      <div className="billing-packs__heading">
        <div>
          <p className="eyebrow">{USAGE_BILLING_PACKS_EYEBROW}</p>
          <h2>{USAGE_BILLING_PACKS_TITLE}</h2>
        </div>
        <p>{USAGE_BILLING_PACKS_DESCRIPTION}</p>
      </div>
      <div className="billing-packs__grid">
        {plans.map((plan) => (
          <BillingPlanCard
            current={plan.planKey === currentPlanKey}
            key={plan.planKey}
            plan={plan}
          />
        ))}
      </div>
    </section>
  );
}
