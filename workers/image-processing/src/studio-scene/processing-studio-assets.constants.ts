import type { StudioBackgroundId, StudioFloorId } from "@studiocar/contracts";

import type { StudioFloorKind } from "./studio-floor-kind";

/**
 * Processing assets are immutable under a versioned prefix. An incompatible
 * change is published under a new version rather than overwriting this one,
 * so a running worker's cache can never disagree with the bucket.
 */
export const STUDIO_ASSET_PREFIX = "studio-assets/v1";

export interface StudioFloorAsset {
  kind: StudioFloorKind;
  objectKey: string;
}

/**
 * Where each semantic ID's processing asset is stored, relative to the
 * configured bucket. The bucket itself always comes from configuration.
 */
export const PROCESSING_STUDIO_ASSETS = {
  backgrounds: {
    PREMIUM_WHITE: `${STUDIO_ASSET_PREFIX}/backgrounds/bg-premium-white.webp`,
    DARK_STUDIO: `${STUDIO_ASSET_PREFIX}/backgrounds/bg-dark-studio.webp`,
    GREY_STUDIO: `${STUDIO_ASSET_PREFIX}/backgrounds/bg-grey-studio.webp`,
  },
  floors: {
    WHITE_STUDIO: {
      kind: "STUDIO_FLOOR",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-white-studio.png`,
    },
    WHITE_TURNTABLE: {
      kind: "TURNTABLE",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-white-turntable.png`,
    },
    DARK_STUDIO_FLOOR: {
      kind: "STUDIO_FLOOR",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-dark-studio.png`,
    },
    DARK_TURNTABLE: {
      kind: "TURNTABLE",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-dark-turntable.png`,
    },
    GREY_STUDIO_FLOOR: {
      kind: "STUDIO_FLOOR",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-grey-studio.png`,
    },
    GREY_TURNTABLE: {
      kind: "TURNTABLE",
      objectKey: `${STUDIO_ASSET_PREFIX}/floors/floor-grey-turntable.png`,
    },
  },
} satisfies {
  backgrounds: Record<StudioBackgroundId, string>;
  floors: Record<StudioFloorId, StudioFloorAsset>;
};
