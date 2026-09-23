import type { BackgroundTreatment, ShadowTreatment } from "@studiocar/contracts";

export interface StudioScenePalette {
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
  /** The floor around a turntable, lighter so the disc reads as a platform. */
  surroundTop: string;
  surroundBottom: string;
  discCentre: string;
  discEdge: string;
  discRim: string;
  discSeam: string;
}

/** The backgrounds drawn as a studio: a wall, a floor, and a shadow. */
export type StudioSceneBackground = Extract<
  BackgroundTreatment,
  "PREMIUM_WHITE" | "GREY_STUDIO" | "DARK_STUDIO"
>;

export const STUDIO_SCENE_PALETTES = {
  PREMIUM_WHITE: {
    wallTop: "#fbfbfa",
    wallBottom: "#eeeeeb",
    floorTop: "#d6d6d2",
    floorBottom: "#c4c4c0",
    surroundTop: "#e2e2df",
    surroundBottom: "#d3d3cf",
    discCentre: "#c9c9c5",
    discEdge: "#b4b4b0",
    discRim: "#8f8f8b",
    discSeam: "#b3b3af",
  },
  GREY_STUDIO: {
    wallTop: "#e9eaeb",
    wallBottom: "#dadcde",
    floorTop: "#b8babd",
    floorBottom: "#a9acb0",
    surroundTop: "#cfd1d4",
    surroundBottom: "#c2c5c8",
    discCentre: "#b3b6ba",
    discEdge: "#a1a4a9",
    discRim: "#7f8388",
    discSeam: "#a3a6ab",
  },
  DARK_STUDIO: {
    wallTop: "#2b2f35",
    wallBottom: "#1f2328",
    floorTop: "#3b4047",
    floorBottom: "#30353b",
    surroundTop: "#33383f",
    surroundBottom: "#2b3036",
    discCentre: "#454b53",
    discEdge: "#3a4047",
    discRim: "#6a717a",
    discSeam: "#50575f",
  },
} satisfies Record<StudioSceneBackground, StudioScenePalette>;

/** How strongly the vehicle's contact shadow is drawn; `null` draws none. */
export const STUDIO_SHADOW_OPACITY = {
  NONE: null,
  NATURAL: 0.38,
  STUDIO: 0.52,
} satisfies Record<ShadowTreatment, number | null>;

/**
 * Proportions of the vehicle's own height and width, so the scene fits the car
 * rather than the car being forced into a fixed scene.
 */
export const HORIZON_ABOVE_CONTACT_RATIO = 0.3;
export const TURNTABLE_SEAM_ABOVE_CONTACT_RATIO = 0.62;
export const TURNTABLE_CENTRE_ABOVE_CONTACT_RATIO = 0.08;
export const TURNTABLE_WIDTH_RATIO = 0.72;
export const TURNTABLE_MAX_CANVAS_WIDTH_RATIO = 0.49;
export const TURNTABLE_DEPTH_RATIO = 0.24;
export const TURNTABLE_SEAM_INSET_RATIO = 0.965;
export const SHADOW_WIDTH_RATIO = 0.47;
export const SHADOW_DEPTH_RATIO = 0.06;
export const SHADOW_RAISE_RATIO = 0.02;
export const SHADOW_BLUR_RATIO = 0.035;
