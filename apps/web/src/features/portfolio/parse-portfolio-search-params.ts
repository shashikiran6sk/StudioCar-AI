import {
  ExistingVehicleSelectionModeSchema,
  PortfolioVersionIdSchema,
  type ExistingVehicleSelectionMode,
} from "@studiocar/contracts";

import {
  PORTFOLIO_STUDIO_QUERY_KEY,
  PORTFOLIO_VERSION_QUERY_KEY,
} from "./portfolio.constants";

export type PortfolioSearchParams = Record<string, string | string[] | undefined>;

export interface PortfolioSearch {
  studio: ExistingVehicleSelectionMode | null;
  versionId: string | null;
}

/** Unknown or malformed values are ignored rather than treated as errors. */
export function parsePortfolioSearchParams(
  searchParams: PortfolioSearchParams,
): PortfolioSearch {
  const studio = ExistingVehicleSelectionModeSchema.safeParse(
    searchParams[PORTFOLIO_STUDIO_QUERY_KEY],
  );
  const versionId = PortfolioVersionIdSchema.safeParse(
    searchParams[PORTFOLIO_VERSION_QUERY_KEY],
  );
  return {
    studio: studio.success ? studio.data : null,
    versionId: versionId.success ? versionId.data : null,
  };
}
