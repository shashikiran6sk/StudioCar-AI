import { PLATE_MODEL_QUERY_COUNT, PlateDetectionSchema, type PlateDetection } from "@studiocar/contracts";

import { PLATE_MINIMUM_MODEL_SCORE, PLATE_MODEL_DIMENSIONS_MESSAGE, PLATE_MODEL_SCORE_MESSAGE } from "./plate-branding.constants";

/** Validates the external model's numeric output before it crosses IPC. */
export function parsePlateModelOutput(logits: Float32Array, boxes: Float32Array): PlateDetection[] {
  if (logits.length !== PLATE_MODEL_QUERY_COUNT || boxes.length !== PLATE_MODEL_QUERY_COUNT * 4) {
    throw new Error(PLATE_MODEL_DIMENSIONS_MESSAGE);
  }
  const detections: PlateDetection[] = [];
  for (const [index, logit] of logits.entries()) {
    if (!Number.isFinite(logit)) throw new Error(PLATE_MODEL_SCORE_MESSAGE);
    const score = 1 / (1 + Math.exp(-logit));
    if (score < PLATE_MINIMUM_MODEL_SCORE) continue;
    const [cx, cy, width, height] = boxes.subarray(index * 4, index * 4 + 4);
    if (cx === undefined || cy === undefined || width === undefined || height === undefined) continue;
    const parsed = PlateDetectionSchema.safeParse({
      height, left: cx - width / 2, score, top: cy - height / 2, width,
    });
    if (parsed.success) detections.push(parsed.data);
  }
  return detections;
}
