import type { ShadowTreatment } from "@studiocar/contracts";

/** Alpha at or above which a cutout pixel is the vehicle itself. */
export const SOLID_ALPHA = 240;

/**
 * A row or column counts as solid vehicle only with this many solid pixels,
 * so a stray speck cannot move the tyre line.
 */
export const SOLID_LINE_MINIMUM_PIXELS = 2;
export const SOLID_LINE_MINIMUM_RATIO = 0.004;

/** The contact shadow's size, relative to the vehicle's solid body. */
export const CONTACT_SHADOW_WIDTH_RATIO = 0.46;
export const CONTACT_SHADOW_DEPTH_RATIO = 0.045;
export const CONTACT_SHADOW_BLUR_RATIO = 0.02;

/** How strongly the contact shadow is drawn; `null` draws none. */
export const CONTACT_SHADOW_OPACITY = {
  NONE: null,
  NATURAL: 0.42,
  STUDIO: 0.58,
} satisfies Record<ShadowTreatment, number | null>;

/** Lossless and fast: intermediate layers are decoded again immediately. */
export const INTERMEDIATE_PNG = { compressionLevel: 0 };
