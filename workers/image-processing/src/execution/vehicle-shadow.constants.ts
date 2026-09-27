import type { ShadowTreatment } from "@studiocar/contracts";
import type { ShadowLayer } from "./vehicle-alpha.types";

// Bounds/contact exclude faint alpha noise; the vehicle itself retains its
// original alpha, including semi-transparent windows and antialiased edges.
export const SUBJECT_ALPHA_THRESHOLD = 128;
export const VEHICLE_CONTACT_REGION_RATIO = 0.25;
export const MAXIMUM_ALPHA = 255;
export const MINIMUM_SHADOW_BLUR = 0.3;
export const SHADOW_EDGE_FADE_BLUR_MULTIPLIER = 2;

const contact = {
  blurRatio: 0.009,
  horizontalSpread: 1,
  verticalCompression: 0.08,
  verticalOffset: 0.005,
  groundBlend: 0,
};
const ambient = {
  blurRatio: 0.035,
  horizontalSpread: 1.06,
  verticalCompression: 0.3,
  verticalOffset: 0.01,
  groundBlend: 0.35,
};

export const VEHICLE_SHADOW_LAYERS = {
  NONE: [],
  NATURAL: [
    { ...ambient, opacity: 0.16 },
    { ...contact, opacity: 0.34 },
  ],
  STUDIO: [
    { ...ambient, opacity: 0.2 },
    { ...contact, opacity: 0.4 },
  ],
} satisfies Record<ShadowTreatment, readonly ShadowLayer[]>;
