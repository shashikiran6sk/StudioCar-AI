import { z } from "zod";

/** Fixed tensor contract of the packaged, pinned plate detector. */
export const PLATE_MODEL_INPUT_EDGE = 640;
export const PLATE_MODEL_QUERY_COUNT = 300;
export const PLATE_MODEL_RGB_BYTES = PLATE_MODEL_INPUT_EDGE ** 2 * 3;

export const PlateDetectionSchema = z.object({
  height: z.number().positive().max(1),
  left: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
  top: z.number().min(0).max(1),
  width: z.number().positive().max(1),
}).strict().refine((box) => box.left + box.width <= 1 && box.top + box.height <= 1);

export const PlateInferenceRequestSchema = z.object({
  pixels: z.instanceof(Uint8Array).refine((bytes) => bytes.byteLength === PLATE_MODEL_RGB_BYTES),
}).strict();

export const PlateInferenceResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    detections: z.array(PlateDetectionSchema).max(PLATE_MODEL_QUERY_COUNT),
    ok: z.literal(true),
  }).strict(),
  z.object({ ok: z.literal(false) }).strict(),
]);

export type PlateDetection = z.infer<typeof PlateDetectionSchema>;
export type PlateInferenceResponse = z.infer<typeof PlateInferenceResponseSchema>;
