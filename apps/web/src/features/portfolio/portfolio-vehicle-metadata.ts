import type { VehiclePortfolio } from "@studiocar/contracts";

export function portfolioVehicleMetadata(
  portfolio: Pick<VehiclePortfolio, "brand" | "model" | "variant" | "stockId">,
): string {
  return [
    portfolio.brand,
    portfolio.model,
    portfolio.variant,
    portfolio.stockId,
  ]
    .filter((value) => value !== null)
    .join(" · ");
}
