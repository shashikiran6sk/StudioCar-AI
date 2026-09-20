import { ButtonLink } from "@studiocar/ui";

import { INVENTORY_PATH } from "../../app/app-routes";
import { MARKETING_COPY, MARKETING_START_PATH } from "./marketing.constants";

export function MarketingFinalCta() {
  return (
    <section className="marketing-final-cta">
      <div>
        <p className="eyebrow">{MARKETING_COPY.cta.eyebrow}</p>
        <h2>{MARKETING_COPY.cta.title}</h2>
        <p>{MARKETING_COPY.cta.body}</p>
      </div>
      <div className="marketing-final-cta__actions">
        <ButtonLink href={MARKETING_START_PATH} size="marketing" variant="secondary">
          {MARKETING_COPY.cta.primaryAction}
        </ButtonLink>
        <ButtonLink href={INVENTORY_PATH} size="marketing" variant="ghost">
          {MARKETING_COPY.cta.secondaryAction}
        </ButtonLink>
      </div>
    </section>
  );
}
