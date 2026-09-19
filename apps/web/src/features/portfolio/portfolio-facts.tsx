import type { VehiclePortfolio } from "@studiocar/contracts";

import {
  PORTFOLIO_BACKGROUND_LABELS,
  PORTFOLIO_ORIGINALS_LABEL,
} from "./portfolio.constants";

const ENABLED_LABEL = "Enabled";
const DISABLED_LABEL = "Disabled";

export interface PortfolioFactsProps {
  portfolio: VehiclePortfolio;
}

export function PortfolioFacts({ portfolio }: PortfolioFactsProps) {
  return (
    <dl className="portfolio-facts">
      <div>
        <dt>Background</dt>
        <dd>{PORTFOLIO_BACKGROUND_LABELS[portfolio.options.background]}</dd>
      </div>
      <div>
        <dt>Shadow</dt>
        <dd>{portfolio.options.shadow.toLowerCase()}</dd>
      </div>
      <div>
        <dt>Enhancement</dt>
        <dd>{portfolio.options.enhancement ? ENABLED_LABEL : DISABLED_LABEL}</dd>
      </div>
      <div>
        <dt>Plate privacy</dt>
        <dd>{portfolio.options.platePrivacy ? ENABLED_LABEL : DISABLED_LABEL}</dd>
      </div>
      <div>
        <dt>Source files</dt>
        <dd>{PORTFOLIO_ORIGINALS_LABEL}</dd>
      </div>
    </dl>
  );
}
