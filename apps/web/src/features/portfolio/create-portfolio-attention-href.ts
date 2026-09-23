import { createVehiclePortfolioPath } from "./create-vehicle-portfolio-path";
import { PORTFOLIO_ATTENTION_ANCHOR } from "./portfolio.constants";

/** Opens a vehicle's portfolio scrolled to what needs the user. */
export function createPortfolioAttentionHref(vehicleId: string): string {
  return `${createVehiclePortfolioPath(vehicleId)}#${PORTFOLIO_ATTENTION_ANCHOR}`;
}
