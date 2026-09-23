import type { ProcessingOptions } from "@studiocar/contracts";

import {
  PORTFOLIO_BACKGROUND_LABELS,
  PORTFOLIO_FLOOR_LABELS,
} from "./portfolio.constants";

const TREATMENT_SEPARATOR = " · ";
const ORIGINAL_BACKGROUND = "ORIGINAL";

/** Names a treatment by what distinguishes versions: background and floor. */
export function formatStudioTreatment(
  options: Pick<ProcessingOptions, "background" | "floor">,
): string {
  const background = PORTFOLIO_BACKGROUND_LABELS[options.background];
  return options.background === ORIGINAL_BACKGROUND
    ? background
    : `${background}${TREATMENT_SEPARATOR}${PORTFOLIO_FLOOR_LABELS[options.floor]}`;
}
