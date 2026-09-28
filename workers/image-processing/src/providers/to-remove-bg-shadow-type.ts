import type { ShadowTreatment } from "@studiocar/contracts";

export function toRemoveBgShadowType(shadow: ShadowTreatment): string {
  switch (shadow) {
    case "NONE":
      return "none";
    case "NATURAL":
      return "car";
    case "STUDIO":
      return "3D";
  }
}
