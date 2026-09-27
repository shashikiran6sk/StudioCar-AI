import type { BackgroundTreatment } from "@studiocar/contracts";

export interface StudioScenePalette {
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
}

/** The backgrounds drawn as a studio wall and floor. */
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

export const HORIZON_ABOVE_CONTACT_RATIO = 0.3;
