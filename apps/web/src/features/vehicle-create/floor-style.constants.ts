import type { FloorStyle } from "@studiocar/contracts";

import type { FloorStyleChoice } from "./floor-style-choice.types";

export const FLOOR_STYLE_LABELS = {
  HORIZON: "Studio floor",
  TURNTABLE: "Turntable",
} satisfies Record<FloorStyle, string>;

export const FLOOR_STYLE_CHOICES: readonly FloorStyleChoice[] = [
  {
    label: FLOOR_STYLE_LABELS.HORIZON,
    value: "HORIZON",
    visualClassName: "floor-style-card__visual--horizon",
  },
  {
    label: FLOOR_STYLE_LABELS.TURNTABLE,
    value: "TURNTABLE",
    visualClassName: "floor-style-card__visual--turntable",
  },
];
