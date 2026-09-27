import type { ShadowTreatment } from "@studiocar/contracts";
import { REMOVE_BG_SHADOW_TYPES } from "./remove-bg-provider.constants";

export function toRemoveBgShadowType(shadow: ShadowTreatment): string {
  return REMOVE_BG_SHADOW_TYPES[shadow];
}
