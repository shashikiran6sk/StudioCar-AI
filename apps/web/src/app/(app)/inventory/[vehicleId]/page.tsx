import { StatePanel } from "@studiocar/ui";
import { notFound, redirect } from "next/navigation";

import { LOGIN_PATH } from "../../../app-routes";
import { createPortfolioHref } from "../../../../features/portfolio/create-portfolio-href";
import {
  parsePortfolioSearchParams,
  type PortfolioSearchParams,
} from "../../../../features/portfolio/parse-portfolio-search-params";
import {
  PORTFOLIO_EMPTY_DESCRIPTION,
  PORTFOLIO_EMPTY_TITLE,
  PORTFOLIO_PROCESSING_DESCRIPTION,
  PORTFOLIO_PROCESSING_TITLE,
  PORTFOLIO_STUDIO_UNAVAILABLE_MESSAGE,
} from "../../../../features/portfolio/portfolio.constants";
import { PortfolioAttentionPanel } from "../../../../features/portfolio/portfolio-attention-panel";
import { PortfolioFacts } from "../../../../features/portfolio/portfolio-facts";
import { PortfolioGallery } from "../../../../features/portfolio/portfolio-gallery";
import { PortfolioHeader } from "../../../../features/portfolio/portfolio-header";
import { PortfolioVersions } from "../../../../features/portfolio/portfolio-versions";
import { selectPortfolioVersion } from "../../../../features/portfolio/select-portfolio-version";
import { StudioSelectionLauncher } from "../../../../features/vehicle-create/studio-selection-launcher";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getPortfolioService } from "../../../../server/portfolio/portfolio-runtime";

export const dynamic = "force-dynamic";

export interface VehiclePortfolioPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<PortfolioSearchParams>;
}

export default async function VehiclePortfolioPage({
  params,
  searchParams,
}: VehiclePortfolioPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const { vehicleId } = await params;
  const search = parsePortfolioSearchParams(await searchParams);
  const service = getPortfolioService();
  const [portfolio, selection] = await Promise.all([
    service.get(session.userId, vehicleId, search.versionId),
    search.studio
      ? service.getStudioSelection(session.userId, vehicleId, {
          mode: search.studio,
          versionId: search.versionId,
        })
      : null,
  ]);
  if (!portfolio) notFound();
  const version = selectPortfolioVersion(portfolio);

  return (
    <div className="portfolio-page">
      <PortfolioHeader portfolio={portfolio} />
      {search.studio && !selection ? (
        <p className="portfolio-notice portfolio-notice--error" role="alert">
          {PORTFOLIO_STUDIO_UNAVAILABLE_MESSAGE}
        </p>
      ) : null}
      {portfolio.status === "PROCESSING" ? (
        <div className="portfolio-notice" role="status">
          <strong>{PORTFOLIO_PROCESSING_TITLE}</strong>
          <span>{PORTFOLIO_PROCESSING_DESCRIPTION}</span>
        </div>
      ) : null}
      {portfolio.attention ? (
        <PortfolioAttentionPanel
          attention={portfolio.attention}
          vehicleId={portfolio.id}
        />
      ) : null}
      {portfolio.images.length > 0 ? (
        <PortfolioGallery portfolio={portfolio} />
      ) : (
        <StatePanel
          description={PORTFOLIO_EMPTY_DESCRIPTION}
          icon={<span aria-hidden="true">◇</span>}
          title={PORTFOLIO_EMPTY_TITLE}
        />
      )}
      {version ? <PortfolioFacts version={version} /> : null}
      <PortfolioVersions portfolio={portfolio} />
      {selection ? (
        <StudioSelectionLauncher
          cancelHref={createPortfolioHref(portfolio.id, {
            versionId: search.versionId,
          })}
          context={selection}
          successHref={createPortfolioHref(portfolio.id)}
        />
      ) : null}
    </div>
  );
}
