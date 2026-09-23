import {
  STUDIO_FLOOR_IDS_BY_BACKGROUND,
  type BackgroundId,
  type StudioBackgroundId,
  type StudioFloorId,
  type StudioTreatment,
} from "@studiocar/contracts";

import type { StudioBackgroundChoice } from "./studio-treatment-choice.types";

/**
 * Selection previews are bundled with the application under `public/`, so the
 * dialog never asks object storage for anything. The worker composes from its
 * own full-resolution copies of the same treatments.
 */
export const STUDIO_PREVIEW_ROOT = "/studio-assets";

export const BACKGROUND_LABELS = {
  ORIGINAL: "Original background",
  PREMIUM_WHITE: "Premium White",
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
} satisfies Record<BackgroundId, string>;

export const STUDIO_FLOOR_LABELS = {
  WHITE_STUDIO: "Soft White Floor",
  WHITE_TURNTABLE: "Pearl Grey Turntable",
  DARK_STUDIO_FLOOR: "Charcoal Floor",
  DARK_TURNTABLE: "Graphite Turntable",
  GREY_STUDIO_FLOOR: "Light Grey Floor",
  GREY_TURNTABLE: "Silver Turntable",
} satisfies Record<StudioFloorId, string>;

const BACKGROUND_PREVIEW_PATHS = {
  PREMIUM_WHITE: `${STUDIO_PREVIEW_ROOT}/backgrounds/premium-white.webp`,
  DARK_STUDIO: `${STUDIO_PREVIEW_ROOT}/backgrounds/dark-studio.webp`,
  GREY_STUDIO: `${STUDIO_PREVIEW_ROOT}/backgrounds/grey-studio.webp`,
} satisfies Record<StudioBackgroundId, string>;

const FLOOR_PREVIEW_PATHS = {
  WHITE_STUDIO: `${STUDIO_PREVIEW_ROOT}/floors/white-studio.webp`,
  WHITE_TURNTABLE: `${STUDIO_PREVIEW_ROOT}/floors/white-turntable.webp`,
  DARK_STUDIO_FLOOR: `${STUDIO_PREVIEW_ROOT}/floors/dark-studio-floor.webp`,
  DARK_TURNTABLE: `${STUDIO_PREVIEW_ROOT}/floors/dark-turntable.webp`,
  GREY_STUDIO_FLOOR: `${STUDIO_PREVIEW_ROOT}/floors/grey-studio-floor.webp`,
  GREY_TURNTABLE: `${STUDIO_PREVIEW_ROOT}/floors/grey-turntable.webp`,
} satisfies Record<StudioFloorId, string>;

function backgroundChoice(id: StudioBackgroundId): StudioBackgroundChoice {
  return {
    id,
    label: BACKGROUND_LABELS[id],
    previewPath: BACKGROUND_PREVIEW_PATHS[id],
    floors: STUDIO_FLOOR_IDS_BY_BACKGROUND[id].map((floorId) => ({
      id: floorId,
      label: STUDIO_FLOOR_LABELS[floorId],
      previewPath: FLOOR_PREVIEW_PATHS[floorId],
    })),
  };
}

/** The three studios, each with exactly the two floors that belong to it. */
export const STUDIO_BACKGROUND_CHOICES: readonly StudioBackgroundChoice[] = [
  backgroundChoice("PREMIUM_WHITE"),
  backgroundChoice("DARK_STUDIO"),
  backgroundChoice("GREY_STUDIO"),
];

/** The floor chosen for a background until the user picks another. */
export const DEFAULT_STUDIO_TREATMENTS = {
  PREMIUM_WHITE: { backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" },
  DARK_STUDIO: { backgroundId: "DARK_STUDIO", floorId: "DARK_STUDIO_FLOOR" },
  GREY_STUDIO: { backgroundId: "GREY_STUDIO", floorId: "GREY_STUDIO_FLOOR" },
} satisfies Record<StudioBackgroundId, StudioTreatment>;
