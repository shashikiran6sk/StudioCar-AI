import type { PlanCatalogEntry } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";

import { BillingCheckoutAction } from "./billing-checkout-action";
import { USAGE_BILLING_CURRENT_PLAN_LABEL } from "./usage-billing.constants";
import { describePlanAction } from "../../server/plans/describe-plan-action";
import { formatPlanCadence } from "../../server/plans/format-plan-cadence";
import { formatPlanPrice } from "../../server/plans/format-plan-price";

export interface BillingPlanCardProps {
  current: boolean;
  plan: PlanCatalogEntry;
}

export function BillingPlanCard({ current, plan }: BillingPlanCardProps) {
  return (
    <article
      className={`billing-plan-card${plan.featured ? " billing-plan-card--featured" : ""}`}
    >
      <header>
        <strong>{plan.displayName}</strong>
        <span>{current ? USAGE_BILLING_CURRENT_PLAN_LABEL : plan.segment}</span>
      </header>
      <p className="billing-plan-card__price">
        {formatPlanPrice(plan.priceMinorUnits, plan.currency)}{" "}
        <small>{formatPlanCadence(plan.billingInterval)}</small>
      </p>
      <p>{plan.description}</p>
      {plan.billingInterval === "MONTHLY" ? <p>Renews monthly</p> : null}
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
      {current || plan.billingInterval === "NONE" ? (
        <Button disabled>{current ? USAGE_BILLING_CURRENT_PLAN_LABEL : "Free plan"}</Button>
      ) : (
        <BillingCheckoutAction
          includedImages={plan.includedImages}
          label={describePlanAction(plan)}
          planKey={plan.planKey}
          variant={plan.billingInterval === "MONTHLY" ? "blue" : "secondary"}
        />
      )}
    </article>
  );
}
