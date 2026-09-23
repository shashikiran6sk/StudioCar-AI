import type { VehiclePortfolio } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";

import { INVENTORY_PATH } from "../../app/app-routes";
import { BACKGROUND_LABELS } from "../studio-treatment/studio-treatment.constants";
import { formatPortfolioDate } from "./format-portfolio-date";
import {
  PORTFOLIO_BACK_LABEL,
  PORTFOLIO_EYEBROW,
  PORTFOLIO_IMAGE_PLURAL,
  PORTFOLIO_IMAGE_SINGULAR,
  PORTFOLIO_NEEDS_ATTENTION_MESSAGE,
} from "./portfolio.constants";
import { portfolioVehicleMetadata } from "./portfolio-vehicle-metadata";

export interface PortfolioHeaderProps {
  portfolio: VehiclePortfolio;
}

export function PortfolioHeader({ portfolio }: PortfolioHeaderProps) {
  const imageLabel =
    portfolio.images.length === 1
      ? PORTFOLIO_IMAGE_SINGULAR
      : PORTFOLIO_IMAGE_PLURAL;
  const metadata = portfolioVehicleMetadata(portfolio);

  return (
    <header className="portfolio-header">
      <ButtonLink className="portfolio-header__back" href={INVENTORY_PATH} variant="ghost">
        ← {PORTFOLIO_BACK_LABEL}
      </ButtonLink>
      <div className="portfolio-header__content">
        <div>
          <p className="eyebrow">
            {PORTFOLIO_EYEBROW} · Completed {formatPortfolioDate(portfolio.completedAt)}
          </p>
          <h1>{portfolio.name}</h1>
          <p className="portfolio-header__metadata">
            {metadata ? `${metadata} · ` : ""}
            {portfolio.images.length} {imageLabel} · {BACKGROUND_LABELS[portfolio.options.backgroundId]}
          </p>
        </div>
      </div>
      {portfolio.status === "NEEDS_ATTENTION" ? (
        <p className="portfolio-header__notice" role="status">
          {PORTFOLIO_NEEDS_ATTENTION_MESSAGE}
        </p>
      ) : null}
    </header>
  );
}
