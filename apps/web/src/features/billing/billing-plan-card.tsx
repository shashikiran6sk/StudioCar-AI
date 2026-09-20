import { Button } from "@studiocar/ui";

import { BillingUnavailableAction } from "./billing-unavailable-action";
import { USAGE_BILLING_CURRENT_PLAN_LABEL } from "./usage-billing.constants";
import type { PricingPlan } from "../pricing/pricing-plans";

export interface BillingPlanCardProps {
  current: boolean;
  plan: PricingPlan;
}

export function BillingPlanCard({ current, plan }: BillingPlanCardProps) {
  return (
    <article
      className={`billing-plan-card${plan.featured ? " billing-plan-card--featured" : ""}`}
    >
      <header>
        <strong>{plan.name}</strong>
        <span>{current ? USAGE_BILLING_CURRENT_PLAN_LABEL : plan.segment}</span>
      </header>
      <p className="billing-plan-card__price">
        {plan.price} <small>{plan.cadence}</small>
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
          label={plan.action}
          planName={plan.name}
          variant={plan.key === "STUDIO_PRO" ? "blue" : "secondary"}
        />
      )}
    </article>
  );
}
