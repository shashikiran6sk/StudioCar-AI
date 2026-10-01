import type { LeonardoCost } from "@studiocar/contracts";

import type { ProviderFailureCategory } from "./provider-failure.types";

/** What one provider exchange did, for metrics. No identifiers, no URLs. */
export interface ProviderExchangeObservation {
  cost: LeonardoCost | null;
  durationMilliseconds: number;
  failureCategory: ProviderFailureCategory | null;
  finishedAtMilliseconds: number;
}
