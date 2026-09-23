import type { ExistingVehicleSelectionMode } from "@studiocar/contracts";

import { createVehiclePortfolioPath } from "./create-vehicle-portfolio-path";
import {
  PORTFOLIO_STUDIO_QUERY_KEY,
  PORTFOLIO_VERSION_QUERY_KEY,
} from "./portfolio.constants";

export interface PortfolioHrefOptions {
  /** Opens the Selection Dialog on the vehicle in this mode. */
  studio?: ExistingVehicleSelectionMode | undefined;
  /** The studio version the gallery shows, or a new version starts from. */
  versionId?: string | null | undefined;
}

export function createPortfolioHref(
  vehicleId: string,
  options: PortfolioHrefOptions = {},
): string {
  const parameters = new URLSearchParams();
  if (options.versionId) {
    parameters.set(PORTFOLIO_VERSION_QUERY_KEY, options.versionId);
  }
  if (options.studio) parameters.set(PORTFOLIO_STUDIO_QUERY_KEY, options.studio);
  const query = parameters.toString();
  const path = createVehiclePortfolioPath(vehicleId);
  return query ? `${path}?${query}` : path;
}
