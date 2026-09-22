import type { PlanCatalogEntry } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";

import { MARKETING_START_PATH } from "../marketing/marketing.constants";
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
        href={MARKETING_START_PATH}
        size="marketing"
        variant={plan.featured ? "secondary" : "primary"}
      >
        {describePlanAction(plan)}
      </ButtonLink>
    </article>
  );
}
