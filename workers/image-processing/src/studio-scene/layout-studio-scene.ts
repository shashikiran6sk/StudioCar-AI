import type { CropMode } from "@studiocar/contracts";

import {
  CONTACT_SHADOW_DEPTH_RATIO,
  CONTACT_SHADOW_WIDTH_RATIO,
} from "./studio-compositing.constants";
import type { StudioFloorKind } from "./studio-floor-kind";
import {
  STUDIO_FLOOR_LAYOUT,
  STUDIO_STAGE,
  TURNTABLE_LAYOUT,
} from "./studio-scene-geometry.constants";
import type {
  StudioSceneLayout,
  VehicleFootprint,
} from "./studio-scene.types";

export interface StudioSceneLayoutInput {
  crop: CropMode;
  cutout: { width: number; height: number };
  floorKind: StudioFloorKind;
  footprint: VehicleFootprint | null;
}

/** Where a vehicle stands on a floor, in stage pixels. */
interface VehicleStand {
  centerX: number;
  contactY: number;
  maximumWidth: (windowWidth: number) => number;
  maximumHeight: number;
  minimumWindowWidth: number;
}

const STAGE_WIDTH = STUDIO_STAGE.width;
const STAGE_HEIGHT = STUDIO_STAGE.height;

function standFor(floorKind: StudioFloorKind): VehicleStand {
  if (floorKind === "TURNTABLE") {
    const platformWidth = 2 * TURNTABLE_LAYOUT.radiusX * STAGE_WIDTH;
    return {
      centerX: TURNTABLE_LAYOUT.centerX * STAGE_WIDTH,
      contactY:
        (TURNTABLE_LAYOUT.centerY +
          TURNTABLE_LAYOUT.contactDepth * TURNTABLE_LAYOUT.radiusY) *
        STAGE_HEIGHT,
      maximumWidth: () => platformWidth * TURNTABLE_LAYOUT.vehicleCoverage,
      maximumHeight: TURNTABLE_LAYOUT.maximumVehicleHeight * STAGE_HEIGHT,
      minimumWindowWidth:
        platformWidth * TURNTABLE_LAYOUT.castShadowSpread +
        2 * TURNTABLE_LAYOUT.windowMargin * STAGE_WIDTH,
    };
  }
  return {
    centerX: STAGE_WIDTH / 2,
    contactY: STUDIO_FLOOR_LAYOUT.contactY * STAGE_HEIGHT,
    maximumWidth: (windowWidth) =>
      Math.min(
        STUDIO_FLOOR_LAYOUT.maximumVehicleWidth * STAGE_WIDTH,
        STUDIO_FLOOR_LAYOUT.maximumWindowFill * windowWidth,
      ),
    maximumHeight: STUDIO_FLOOR_LAYOUT.maximumVehicleHeight * STAGE_HEIGHT,
    minimumWindowWidth: STUDIO_FLOOR_LAYOUT.minimumWindowWidth * STAGE_WIDTH,
  };
}

/**
 * The output's shape. Maintaining the composition keeps the photo's aspect
 * ratio; otherwise the whole stage is shown, or a square for `SQUARE`.
 */
function aspectFor(
  crop: CropMode,
  cutout: StudioSceneLayoutInput["cutout"],
): number {
  switch (crop) {
    case "MAINTAIN_COMPOSITION":
      return cutout.width / cutout.height;
    case "FIT_VEHICLE":
      return STAGE_WIDTH / STAGE_HEIGHT;
    case "SQUARE":
      return 1;
  }
}

/**
 * Places a vehicle in a studio scene.
 *
 * The frame is cut from the stage around the floor's stand: it always keeps
 * the floor, is never narrower than the turntable, and grows upward rather
 * than cropping the platform when the photo is tall. The vehicle is scaled to
 * fit the stand and its tyre line is put exactly on the floor's contact line.
 * The vehicle is never enlarged; a small photo produces a smaller scene.
 */
export function layoutStudioScene(
  input: StudioSceneLayoutInput,
): StudioSceneLayout {
  const stand = standFor(input.floorKind);
  const aspect = aspectFor(input.crop, input.cutout);
  const windowWidth = Math.max(aspect * STAGE_HEIGHT, stand.minimumWindowWidth);
  const windowHeight = windowWidth / aspect;
  const windowLeft = stand.centerX - windowWidth / 2;
  const windowTop = STAGE_HEIGHT - windowHeight;
  const body = input.footprint?.body;

  const fit = body
    ? Math.min(
        stand.maximumWidth(windowWidth) / body.width,
        stand.maximumHeight / body.height,
      )
    : windowWidth / input.cutout.width;
  const outputScale = Math.min(1, 1 / fit);
  const vehicleScale = fit * outputScale;

  const layout = {
    stage: {
      width: Math.max(1, Math.round(STAGE_WIDTH * outputScale)),
      height: Math.max(1, Math.round(STAGE_HEIGHT * outputScale)),
    },
    window: {
      left: Math.round(windowLeft * outputScale),
      top: Math.round(windowTop * outputScale),
      width: Math.max(1, Math.round(windowWidth * outputScale)),
      height: Math.max(1, Math.round(windowHeight * outputScale)),
    },
    vehicleScale,
  };
  if (!input.footprint || !body) {
    return { ...layout, contactShadow: null, vehicle: null };
  }

  const standX = (stand.centerX - windowLeft) * outputScale;
  const contactY = (stand.contactY - windowTop) * outputScale;
  const cutoutLeft = standX - (body.left + body.width / 2) * vehicleScale;
  const cutoutTop = contactY - (body.top + body.height) * vehicleScale;
  const { extent } = input.footprint;

  return {
    ...layout,
    contactShadow: {
      cx: standX,
      cy: contactY,
      rx: body.width * vehicleScale * CONTACT_SHADOW_WIDTH_RATIO,
      ry: Math.max(1, body.height * vehicleScale * CONTACT_SHADOW_DEPTH_RATIO),
    },
    vehicle: {
      left: Math.round(cutoutLeft + extent.left * vehicleScale),
      top: Math.round(cutoutTop + extent.top * vehicleScale),
      width: Math.max(1, Math.round(extent.width * vehicleScale)),
      height: Math.max(1, Math.round(extent.height * vehicleScale)),
    },
  };
}
