import type { PortfolioVersion } from "@studiocar/contracts";

import { formatCropMode } from "../vehicle-create/format-crop-mode";
import {
  PORTFOLIO_BACKGROUND_LABELS,
  PORTFOLIO_BATCH_LABEL_TITLE,
  PORTFOLIO_FLOOR_LABELS,
  PORTFOLIO_ORIGINALS_LABEL,
} from "./portfolio.constants";

const ENABLED_LABEL = "Enabled";
const DISABLED_LABEL = "Disabled";

export interface PortfolioFactsProps {
  /** The studio version being shown: its treatment and its label. */
  version: Pick<PortfolioVersion, "label" | "options">;
}

/**
 * The treatment that made the version on show, read from the stored options.
 * A label is the person's own name for it and is shown beside, never instead
 * of, what was actually applied.
 */
export function PortfolioFacts({ version }: PortfolioFactsProps) {
  const { label, options } = version;
  return (
    <div className="portfolio-treatment">
      {label ? (
        <p className="portfolio-treatment__label">
          <span>{PORTFOLIO_BATCH_LABEL_TITLE}</span>
          <strong>{label}</strong>
        </p>
      ) : null}
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
          <dt>Composition</dt>
          <dd>{formatCropMode(options.crop)}</dd>
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
    </div>
  );
}
