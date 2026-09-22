import type { PlanCatalogEntry } from "@studiocar/contracts";

import { PricingCard } from "./pricing-card";
import { PRICING_COPY } from "./pricing.constants";
import { MARKETING_PRICING_ID } from "../marketing/marketing.constants";

export interface PricingSectionProps {
  plans: readonly PlanCatalogEntry[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section className="pricing-section" id={MARKETING_PRICING_ID}>
      <div className="pricing-section__heading">
        <p className="eyebrow">{PRICING_COPY.eyebrow}</p>
        <h2>{PRICING_COPY.title}</h2>
        <p>{PRICING_COPY.summary}</p>
      </div>
      <div className="pricing-section__grid">
        {plans.map((plan) => (
          <PricingCard key={plan.planKey} plan={plan} />
        ))}
      </div>
      <p className="pricing-section__note">{PRICING_COPY.note}</p>
    </section>
  );
}
