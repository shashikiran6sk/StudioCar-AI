import type { StudioBackgroundAssets } from "./studio-background.types";

const ASSET_WIDTH = 3840;
const ASSET_HEIGHT = 2160;

/**
 * The six StudioCar backgrounds, supplied as 3840×2160 artwork. Floor seams
 * are the first floor row, measured from the artwork at full resolution.
 */
export const STUDIO_BACKGROUND_ASSETS = {
  PREMIUM_WHITE: {
    PLAIN: { file: "premium-white-plain.png", height: ASSET_HEIGHT, seamY: null, width: ASSET_WIDTH },
    HORIZON: { file: "premium-white-floor.png", height: ASSET_HEIGHT, seamY: 1494, width: ASSET_WIDTH },
  },
  GREY_STUDIO: {
    PLAIN: { file: "grey-studio-plain.png", height: ASSET_HEIGHT, seamY: null, width: ASSET_WIDTH },
    HORIZON: { file: "grey-studio-floor.png", height: ASSET_HEIGHT, seamY: 1474, width: ASSET_WIDTH },
  },
  DARK_STUDIO: {
    PLAIN: { file: "dark-studio-plain.png", height: ASSET_HEIGHT, seamY: null, width: ASSET_WIDTH },
    HORIZON: { file: "dark-studio-floor.png", height: ASSET_HEIGHT, seamY: 1471, width: ASSET_WIDTH },
  },
} as const satisfies StudioBackgroundAssets;

/**
 * How far above the vehicle's tyre line the wall meets the floor, as a share
 * of the vehicle's height. The far wheels of a three-quarter view stand well
 * below this, so every tyre sits on the floor.
 */
export const HORIZON_ABOVE_CONTACT_RATIO = 0.3;

/** Where the packaged backgrounds live, relative to the handler bundle. */
export const STUDIO_BACKGROUND_DIRECTORY = "assets/backgrounds";
