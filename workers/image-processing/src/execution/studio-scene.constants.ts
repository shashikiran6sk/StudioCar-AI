import type { BackgroundTreatment, ShadowTreatment } from "@studiocar/contracts";

export interface StudioScenePalette {
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
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
  },
  GREY_STUDIO: {
    wallTop: "#e9eaeb",
    wallBottom: "#dadcde",
    floorTop: "#b8babd",
    floorBottom: "#a9acb0",
  },
  DARK_STUDIO: {
    wallTop: "#2b2f35",
    wallBottom: "#1f2328",
    floorTop: "#3b4047",
    floorBottom: "#30353b",
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
export const SHADOW_WIDTH_RATIO = 0.47;
export const SHADOW_DEPTH_RATIO = 0.06;
export const SHADOW_RAISE_RATIO = 0.02;
export const SHADOW_BLUR_RATIO = 0.035;
