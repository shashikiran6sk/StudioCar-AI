import type { PortfolioVersion, VehiclePortfolio } from "@studiocar/contracts";

/** The studio version the gallery is showing, if the vehicle has one. */
export function selectPortfolioVersion(
  portfolio: Pick<VehiclePortfolio, "selectedVersionId" | "versions">,
): PortfolioVersion | null {
  return (
    portfolio.versions.find(
      (version) => version.id === portfolio.selectedVersionId,
    ) ?? null
  );
}
