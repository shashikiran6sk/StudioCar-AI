import type { VehiclePortfolio } from "@studiocar/contracts";
import Link from "next/link";

import { createPortfolioHref } from "./create-portfolio-href";
import { formatPortfolioDate } from "./format-portfolio-date";
import { formatStudioTreatment } from "./format-studio-treatment";
import {
  PORTFOLIO_IMAGE_PLURAL,
  PORTFOLIO_IMAGE_SINGULAR,
  PORTFOLIO_VERSION_SELECTED_LABEL,
  PORTFOLIO_VERSIONS_TITLE,
} from "./portfolio.constants";

export interface PortfolioVersionsProps {
  portfolio: Pick<VehiclePortfolio, "id" | "selectedVersionId" | "versions">;
}

/** Every studio version of the vehicle; choosing one shows it above. */
export function PortfolioVersions({ portfolio }: PortfolioVersionsProps) {
  if (portfolio.versions.length < 2) return null;

  return (
    <nav aria-label={PORTFOLIO_VERSIONS_TITLE} className="portfolio-versions">
      <h2>{PORTFOLIO_VERSIONS_TITLE}</h2>
      <ul>
        {portfolio.versions.map((version) => {
          const current = version.id === portfolio.selectedVersionId;
          return (
            <li key={version.id}>
              <Link
                aria-current={current ? "page" : undefined}
                className="portfolio-version"
                href={createPortfolioHref(portfolio.id, { versionId: version.id })}
                scroll={false}
              >
                <strong>{formatStudioTreatment(version.options)}</strong>
                <span>
                  {version.imageCount}{" "}
                  {version.imageCount === 1
                    ? PORTFOLIO_IMAGE_SINGULAR
                    : PORTFOLIO_IMAGE_PLURAL}{" "}
                  · {formatPortfolioDate(version.completedAt)}
                  {current ? ` · ${PORTFOLIO_VERSION_SELECTED_LABEL}` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
