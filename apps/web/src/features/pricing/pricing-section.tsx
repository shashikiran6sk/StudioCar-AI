import { ButtonLink } from "@studiocar/ui";

import { MARKETING_PRICING_ID, MARKETING_START_PATH } from "../marketing/marketing.constants";
import { PRICING_COPY, PRICING_PLANS } from "./pricing-plans";

export function PricingSection() {
  return (
    <section className="pricing-section" id={MARKETING_PRICING_ID}>
      <div className="pricing-section__heading">
        <p className="eyebrow">{PRICING_COPY.eyebrow}</p>
        <h2>{PRICING_COPY.title}</h2>
        <p>{PRICING_COPY.summary}</p>
      </div>
      <div className="pricing-section__grid">
        {PRICING_PLANS.map((plan) => (
          <article
            className={`pricing-card${plan.featured ? " pricing-card--featured" : ""}`}
            key={plan.name}
          >
            <header><strong>{plan.name}</strong><span>{plan.segment}</span></header>
            <p className="pricing-card__price">{plan.price} <small>{plan.cadence}</small></p>
            <p className="pricing-card__description">{plan.description}</p>
            <ul>
              {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
            </ul>
            <ButtonLink
              href={MARKETING_START_PATH}
              size="marketing"
              variant={plan.featured ? "secondary" : "primary"}
            >
              {plan.action}
            </ButtonLink>
          </article>
        ))}
      </div>
      <p className="pricing-section__note">
        {PRICING_COPY.note}
      </p>
    </section>
  );
}
