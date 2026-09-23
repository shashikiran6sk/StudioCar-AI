import type { VehiclePortfolio } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";

import { INVENTORY_PATH } from "../../app/app-routes";
import { createPortfolioHref } from "./create-portfolio-href";
import { formatPortfolioDate } from "./format-portfolio-date";
import { formatStudioTreatment } from "./format-studio-treatment";
import {
  PORTFOLIO_BACK_LABEL,
  PORTFOLIO_CREATE_VERSION_LABEL,
  PORTFOLIO_EYEBROW,
  PORTFOLIO_IMAGE_PLURAL,
  PORTFOLIO_IMAGE_SINGULAR,
} from "./portfolio.constants";
import { portfolioVehicleMetadata } from "./portfolio-vehicle-metadata";
import { selectPortfolioVersion } from "./select-portfolio-version";

export interface PortfolioHeaderProps {
  portfolio: VehiclePortfolio;
}

export function PortfolioHeader({ portfolio }: PortfolioHeaderProps) {
  const version = selectPortfolioVersion(portfolio);
  const metadata = portfolioVehicleMetadata(portfolio);
  const details = [
    metadata,
    version
      ? `${String(version.imageCount)} ${
          version.imageCount === 1
            ? PORTFOLIO_IMAGE_SINGULAR
            : PORTFOLIO_IMAGE_PLURAL
        }`
      : "",
    version ? formatStudioTreatment(version.options) : "",
  ].filter((value) => value.length > 0);

  return (
    <header className="portfolio-header">
      <ButtonLink className="portfolio-header__back" href={INVENTORY_PATH} variant="ghost">
        ← {PORTFOLIO_BACK_LABEL}
      </ButtonLink>
      <div className="portfolio-header__content">
        <div>
          <p className="eyebrow">
            {PORTFOLIO_EYEBROW}
            {version ? ` · Completed ${formatPortfolioDate(version.completedAt)}` : ""}
          </p>
          <h1>{portfolio.name}</h1>
          {details.length > 0 ? (
            <p className="portfolio-header__metadata">{details.join(" · ")}</p>
          ) : null}
        </div>
        {portfolio.canCreateVersion ? (
          <ButtonLink
            href={createPortfolioHref(portfolio.id, {
              studio: "CREATE_VARIANT",
              versionId: portfolio.selectedVersionId,
            })}
            variant="secondary"
          >
            {PORTFOLIO_CREATE_VERSION_LABEL}
          </ButtonLink>
        ) : null}
      </div>
    </header>
  );
}
