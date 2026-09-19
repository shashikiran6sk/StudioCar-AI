import type { BackgroundTreatment } from "@studiocar/contracts";

import type { BackgroundTreatmentChoice } from "./background-treatment-choice.types";

export const BACKGROUND_TREATMENT_LABELS = {
  ORIGINAL: "Original",
  PREMIUM_WHITE: "Premium White",
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
  DEALERSHIP: "Dealership",
  CUSTOM: "Custom",
} satisfies Record<BackgroundTreatment, string>;

export const BACKGROUND_TREATMENT_CHOICES: readonly BackgroundTreatmentChoice[] = [
  {
    disabled: false,
    label: BACKGROUND_TREATMENT_LABELS.PREMIUM_WHITE,
    value: "PREMIUM_WHITE",
    visualClassName: "background-treatment-card__visual--white",
  },
  {
    disabled: false,
    label: BACKGROUND_TREATMENT_LABELS.DARK_STUDIO,
    value: "DARK_STUDIO",
    visualClassName: "background-treatment-card__visual--dark",
  },
  {
    disabled: false,
    label: BACKGROUND_TREATMENT_LABELS.GREY_STUDIO,
    value: "GREY_STUDIO",
    visualClassName: "background-treatment-card__visual--grey",
  },
  {
    disabled: false,
    label: BACKGROUND_TREATMENT_LABELS.DEALERSHIP,
    value: "DEALERSHIP",
    visualClassName: "background-treatment-card__visual--dealership",
  },
  {
    disabled: true,
    label: BACKGROUND_TREATMENT_LABELS.CUSTOM,
    value: "CUSTOM",
    visualClassName: "background-treatment-card__visual--custom",
  },
];
