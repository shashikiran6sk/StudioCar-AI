import type { PlateSurfaceFitPass, PlateSurfacePass } from "./plate-branding.types";

export const PLATE_BRANDING_DIRECTORY = "assets/plate-branding";
export const PLATE_MODEL_FILE = "plate-rtdetr.onnx";
export const PLATE_MODEL_SHA256 = "50f9bf9d7eaa97ade59063ba608107203d0575a84c0fb27e0ebf3bab6f594366";
export const PLATE_LOGO_FILE = "dealersdrive-logo.png";
export const PLATE_DETECTOR_ENTRY = "plate-detector.mjs";
export const PLATE_DETECTOR_HEAP_MEGABYTES = 128;
// Must be in the child environment before the native module is imported.
// ORT 1.30's full opt-out suppresses the uploader, device ID and local cache.
export const PLATE_DETECTOR_ENVIRONMENT = { ORT_DISABLE_TELEMETRY: "1" } satisfies Record<string, string>;
export const PLATE_DETECTOR_MATTE = "#808080";
export const PLATE_ARTWORK_MATTE = "#000000";
export const PLATE_DETECTOR_UNAVAILABLE_MESSAGE = "Plate detector unavailable.";
export const PLATE_MODEL_DIMENSIONS_MESSAGE = "Invalid plate model output dimensions.";
export const PLATE_MODEL_SCORE_MESSAGE = "Invalid plate model score.";
// Scores in this model are compressed, not calibrated probabilities. Geometry
// and a physical plate-surface check are mandatory in addition to this cutoff.
export const PLATE_MINIMUM_MODEL_SCORE = 0.08;
export const PLATE_MINIMUM_WIDTH = 32;
export const PLATE_MINIMUM_HEIGHT = 10;
export const PLATE_MINIMUM_ASPECT = 1;
export const PLATE_MAXIMUM_ASPECT = 6.5;
export const PLATE_MAXIMUM_FRAME_SHARE = 0.08;
export const PLATE_DUPLICATE_OVERLAP = 0.5;
export const PLATE_DOMINANT_AREA_RATIO = 4;
export const PLATE_DOMINANT_SCORE_MARGIN = 0.02;
export const PLATE_MAXIMUM_AMBIGUOUS_SURFACE_CHECKS = 3;
export const PLATE_OPAQUE_ALPHA = 240;
export const PLATE_OPAQUE_SAMPLE_CENTER = 0.5;
export const PLATE_STRONG_MAXIMUM_NONOPAQUE_BOX_SAMPLES = 1;
export const PLATE_SURFACE_SAMPLE_EDGE = 320;
export const PLATE_SURFACE_MARGIN = 0.2;
export const PLATE_SURFACE_MINIMUM_COVERAGE = 0.55;
export const PLATE_SURFACE_MINIMUM_SOLIDITY = 0.45;
export const PLATE_SURFACE_MAXIMUM_BOX_AREA_RATIO = 1.6;
export const PLATE_SURFACE_MINIMUM_QUAD_FIT = 0.9;
export const PLATE_TILTED_MINIMUM_COVERAGE = 0.5;
export const PLATE_TILTED_MINIMUM_QUAD_FIT = 0.93;
export const PLATE_TILTED_MINIMUM_WIDTH_SHARE = 0.85;
export const PLATE_TILTED_MINIMUM_SIDE_SHARE = 0.45;
export const PLATE_TILTED_MINIMUM_RISE_SHARE = 0.2;
export const PLATE_TILTED_MAXIMUM_RISE_DIFFERENCE_SHARE = 0.15;
export const PLATE_PROJECTED_MINIMUM_COVERAGE = 0.35;
export const PLATE_PROJECTED_MINIMUM_RECTIFIED_COVERAGE = 0.75;
export const PLATE_PROJECTED_MINIMUM_SIDE_SHARE = 0.7;
export const PLATE_PROJECTED_MINIMUM_AVERAGE_SIDE_SHARE = 0.85;
export const PLATE_PROJECTED_MINIMUM_HULL_SHARE = 0.93;
export const PLATE_OUTLINE_MINIMUM_DIRECTION_DOT = 0.98;
export const PLATE_OUTLINE_MINIMUM_SEGMENT_SHARE = 0.1;
export const PLATE_OUTLINE_MINIMUM_SUPPORT_SHARE = 0.4;
export const PLATE_OUTLINE_MAXIMUM_RESIDUAL_SHARE = 0.02;
export const PLATE_OUTLINE_MAXIMUM_AREA_RATIO = 1.1;
export const PLATE_OUTLINE_MAXIMUM_CORNER_SHIFT_SHARE = 0.08;
export const PLATE_STANDARD_SURFACE_FIT_PASSES: readonly PlateSurfaceFitPass[] = [
  { minimumCoverage: PLATE_SURFACE_MINIMUM_COVERAGE, minimumQuadFit: PLATE_SURFACE_MINIMUM_QUAD_FIT, requireTilt: false, requireProjectedCoverage: false },
  { minimumCoverage: PLATE_TILTED_MINIMUM_COVERAGE, minimumQuadFit: PLATE_TILTED_MINIMUM_QUAD_FIT, requireTilt: true, requireProjectedCoverage: false },
];
export const PLATE_PROJECTED_SURFACE_FIT_PASSES: readonly PlateSurfaceFitPass[] = [
  { minimumCoverage: PLATE_PROJECTED_MINIMUM_COVERAGE, minimumQuadFit: PLATE_SURFACE_MINIMUM_QUAD_FIT, requireTilt: true, requireProjectedCoverage: true },
];
export const PLATE_SURFACE_FIT_PASSES: readonly PlateSurfaceFitPass[] = [
  ...PLATE_STANDARD_SURFACE_FIT_PASSES, ...PLATE_PROJECTED_SURFACE_FIT_PASSES,
];
export const PLATE_SURFACE_MINIMUM_EDGE_COVERAGE = 0.75;
export const PLATE_SURFACE_STRONG_MINIMUM_EDGE_COVERAGE = 0.7;
export const PLATE_SURFACE_EDGE_TOLERANCE_PIXELS = 4;
export const PLATE_SURFACE_MAXIMUM_EXPANSION_RATIO = 1.5;
export const PLATE_SURFACE_NESTING_TOLERANCE = 0.05;
export const PLATE_SURFACE_MAXIMUM_CENTER_X_OFFSET = 0.2;
export const PLATE_SURFACE_MAXIMUM_CENTER_Y_OFFSET = 0.25;
export const PLATE_SURFACE_NEIGHBORS = [[-1, 0], [1, 0], [0, -1], [0, 1]] satisfies readonly [number, number][];
export const PLATE_OPAQUE_SAMPLE_POSITIONS = [0.1, PLATE_OPAQUE_SAMPLE_CENTER, 0.9] satisfies readonly number[];
export const PLATE_SURFACE_OPAQUE_SAMPLE_POSITIONS = [0, PLATE_OPAQUE_SAMPLE_CENTER, 1] satisfies readonly number[];
export const PLATE_WHITE_MINIMUM_CHANNEL = 185;
export const PLATE_WHITE_SHADOW_MINIMUM_CHANNEL = 135;
export const PLATE_WHITE_SHADOW_BRIGHT_MINIMUM_CHANNEL = 155;
export const PLATE_STRONG_MODEL_SCORE = 0.13;
export const PLATE_WHITE_DEEP_SHADOW_MINIMUM_CHANNEL = 125;
export const PLATE_WHITE_MINIMUM_BRIGHT_SHARE = 0.5;
export const PLATE_WHITE_SURFACE_THRESHOLD_STEP = 5;
export const PLATE_WHITE_SURFACE_PASSES: readonly PlateSurfacePass[] = [
  { minimumModelScore: PLATE_MINIMUM_MODEL_SCORE, minimumChannel: PLATE_WHITE_SHADOW_MINIMUM_CHANNEL, seedChannel: PLATE_WHITE_SHADOW_BRIGHT_MINIMUM_CHANNEL },
  { minimumModelScore: PLATE_STRONG_MODEL_SCORE, minimumChannel: PLATE_WHITE_DEEP_SHADOW_MINIMUM_CHANNEL, seedChannel: PLATE_WHITE_SHADOW_MINIMUM_CHANNEL },
];
export const PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD = 75;
export const PLATE_YELLOW_MINIMUM_RED = 140;
export const PLATE_YELLOW_MINIMUM_GREEN = 115;
export const PLATE_YELLOW_MAXIMUM_BLUE_RATIO = 0.7;
export const PLATE_GREEN_MINIMUM_CHANNEL = 75;
export const PLATE_GREEN_RED_RATIO = 1.4;
export const PLATE_GREEN_BLUE_RATIO = 1.2;
export const PLATE_MAXIMUM_RENDER_PIXELS = 1_000_000;
export const PLATE_ARTWORK_WIDTH = 640;
export const PLATE_ARTWORK_INNER_SHARE = 0.9;
export const PLATE_GEOMETRY_EPSILON = 0.000001;
export const PLATE_BRANDING_EVENT = "plate_branding_result";
export const PLATE_BRANDING_OUTCOMES = {
  APPLIED: "applied",
  PREPARED: "prepared",
  ERROR: "skipped_error",
  NO_PLATE: "skipped_no_reliable_plate",
  MEMORY: "skipped_memory_budget",
} satisfies Record<string, string>;
