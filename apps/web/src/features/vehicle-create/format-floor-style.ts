import type { FloorStyle } from "@studiocar/contracts";

import { FLOOR_STYLE_LABELS } from "./floor-style.constants";

export function formatFloorStyle(floor: FloorStyle): string {
  return FLOOR_STYLE_LABELS[floor];
}
