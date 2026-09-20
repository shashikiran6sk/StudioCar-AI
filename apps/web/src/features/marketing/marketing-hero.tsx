import { ButtonLink, ComparisonSlider } from "@studiocar/ui";

import { MarketingCarStage } from "./marketing-car-stage";
import {
  MARKETING_COPY,
  MARKETING_FEATURES_ID,
  MARKETING_HERO_PROOF,
  MARKETING_START_PATH,
} from "./marketing.constants";

export function MarketingHero() {
  return (
    <section className="marketing-hero" id="top">
      <div className="marketing-hero__copy">
        <p className="marketing-pill"><span aria-hidden="true" />{MARKETING_COPY.hero.eyebrow}</p>
        <h1>{MARKETING_COPY.hero.title}</h1>
        <p className="marketing-hero__summary">
          {MARKETING_COPY.hero.summary}
        </p>
        <div className="marketing-hero__actions">
          <ButtonLink href={MARKETING_START_PATH} size="marketing" variant="primary">
            {MARKETING_COPY.hero.primaryAction}
          </ButtonLink>
          <ButtonLink href={`#${MARKETING_FEATURES_ID}`} size="marketing">
            {MARKETING_COPY.hero.secondaryAction}
          </ButtonLink>
        </div>
        <dl className="marketing-proof">
          {MARKETING_HERO_PROOF.map((proof) => (
            <div key={proof.value}><dt>{proof.value}</dt><dd>{proof.label}</dd></div>
          ))}
        </dl>
      </div>
      <div className="marketing-hero__visual">
        <ComparisonSlider
          after={<MarketingCarStage priority treatment="premium" />}
          afterLabel="Studio processed"
          before={<MarketingCarStage priority treatment="original" />}
          label={MARKETING_COPY.hero.comparisonLabel}
          summary={MARKETING_COPY.hero.treatmentSummary}
        />
      </div>
    </section>
  );
}
