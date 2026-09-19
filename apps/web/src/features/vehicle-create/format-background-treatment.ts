import type { BackgroundTreatment } from "@studiocar/contracts";

import { BACKGROUND_TREATMENT_LABELS } from "./background-treatment.constants";

export function formatBackgroundTreatment(
  background: BackgroundTreatment,
): string {
  return BACKGROUND_TREATMENT_LABELS[background];
}
