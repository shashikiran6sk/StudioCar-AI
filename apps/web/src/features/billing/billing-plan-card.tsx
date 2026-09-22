import type { PlanCatalogEntry } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";

import { BillingUnavailableAction } from "./billing-unavailable-action";
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
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
      {current ? (
        <Button disabled>{USAGE_BILLING_CURRENT_PLAN_LABEL}</Button>
      ) : (
        <BillingUnavailableAction
          label={describePlanAction(plan)}
          planName={plan.displayName}
          variant={plan.billingInterval === "MONTHLY" ? "blue" : "secondary"}
        />
      )}
    </article>
  );
}
