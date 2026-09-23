import type { FloorStyle } from "@studiocar/contracts";

import type { FloorStyleChoice } from "./floor-style-choice.types";

export const FLOOR_STYLE_LABELS = {
  PLAIN: "Plain background",
  HORIZON: "Standard floor",
} satisfies Record<FloorStyle, string>;

export const FLOOR_STYLE_CHOICES: readonly FloorStyleChoice[] = [
  {
    label: FLOOR_STYLE_LABELS.PLAIN,
    value: "PLAIN",
    visualClassName: "floor-style-card__visual--plain",
  },
  {
    label: FLOOR_STYLE_LABELS.HORIZON,
    value: "HORIZON",
    visualClassName: "floor-style-card__visual--horizon",
  },
];
