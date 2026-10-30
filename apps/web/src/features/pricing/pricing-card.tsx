import type { PlanCatalogEntry } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";

import { getPlanActionHref } from "./get-plan-action-href";
import { describePlanAction } from "../../server/plans/describe-plan-action";
import { formatPlanCadence } from "../../server/plans/format-plan-cadence";
import { formatPlanPrice } from "../../server/plans/format-plan-price";

export interface PricingCardProps {
  plan: PlanCatalogEntry;
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <article
      className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
    >
      <header>
        <strong>{plan.displayName}</strong>
        <span>{plan.segment}</span>
      </header>
      <p className="pricing-card__price">
        {formatPlanPrice(plan.priceMinorUnits, plan.currency)}{" "}
        <small>{formatPlanCadence(plan.billingInterval)}</small>
      </p>
      <p className="pricing-card__description">{plan.description}</p>
      <ul>
        {plan.features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>
      <ButtonLink
        href={getPlanActionHref(plan)}
        size="marketing"
        variant={plan.featured ? "secondary" : "primary"}
      >
        {describePlanAction(plan)}
      </ButtonLink>
    </article>
  );
}
