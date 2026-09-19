import type { BackgroundTreatment } from "@studiocar/contracts";

export interface BackgroundTreatmentChoice {
  disabled: boolean;
  label: string;
  value: BackgroundTreatment;
  visualClassName: string;
}
