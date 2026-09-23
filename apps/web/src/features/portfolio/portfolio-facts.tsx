import type { ProcessingOptions } from "@studiocar/contracts";

import {
  PORTFOLIO_BACKGROUND_LABELS,
  PORTFOLIO_FLOOR_LABELS,
  PORTFOLIO_ORIGINALS_LABEL,
} from "./portfolio.constants";

const ENABLED_LABEL = "Enabled";
const DISABLED_LABEL = "Disabled";

export interface PortfolioFactsProps {
  /** The treatment of the studio version being shown. */
  options: ProcessingOptions;
}

export function PortfolioFacts({ options }: PortfolioFactsProps) {
  return (
    <dl className="portfolio-facts">
      <div>
        <dt>Background</dt>
        <dd>{PORTFOLIO_BACKGROUND_LABELS[options.background]}</dd>
      </div>
      <div>
        <dt>Floor</dt>
        <dd>{PORTFOLIO_FLOOR_LABELS[options.floor]}</dd>
      </div>
      <div>
        <dt>Shadow</dt>
        <dd>{options.shadow.toLowerCase()}</dd>
      </div>
      <div>
        <dt>Enhancement</dt>
        <dd>{options.enhancement ? ENABLED_LABEL : DISABLED_LABEL}</dd>
      </div>
      <div>
        <dt>Plate privacy</dt>
        <dd>{options.platePrivacy ? ENABLED_LABEL : DISABLED_LABEL}</dd>
      </div>
      <div>
        <dt>Source files</dt>
        <dd>{PORTFOLIO_ORIGINALS_LABEL}</dd>
      </div>
    </dl>
  );
}
