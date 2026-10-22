import { describe, expect, it } from "vitest";

import { PLATE_MODEL_RGB_BYTES, PlateDetectionSchema, PlateInferenceRequestSchema, PlateInferenceResponseSchema } from "../../../packages/contracts/src/plate-detection";

const BOX = { height: 0.1, left: 0.2, score: 0.12, top: 0.5, width: 0.3 };
describe("plate detection IPC contracts", () => {
  it("requires one fixed-size RGB input, without arbitrary paths or settings", () => {
    expect(PlateInferenceRequestSchema.safeParse({ pixels: new Uint8Array(PLATE_MODEL_RGB_BYTES) }).success).toBe(true);
    for (const pixels of [[], new Uint8Array(3), "image-url"]) expect(PlateInferenceRequestSchema.safeParse({ pixels }).success).toBe(false);
    expect(PlateInferenceRequestSchema.safeParse({ pixels: new Uint8Array(PLATE_MODEL_RGB_BYTES), model: "/tmp/model" }).success).toBe(false);
  });
  it("rejects invalid or out-of-frame external geometry", () => {
    expect(PlateDetectionSchema.parse(BOX)).toEqual(BOX);
    for (const value of [{ ...BOX, left: 0.9 }, { ...BOX, score: NaN }, { ...BOX, width: -1 }, { ...BOX, height: Infinity }]) {
      expect(PlateDetectionSchema.safeParse(value).success).toBe(false);
    }
  });
  it("bounds responses and excludes error messages and recognized numbers", () => {
    expect(PlateInferenceResponseSchema.parse({ ok: false })).toEqual({ ok: false });
    expect(PlateInferenceResponseSchema.safeParse({ ok: true, detections: Array.from({ length: 301 }, () => BOX) }).success).toBe(false);
    expect(PlateInferenceResponseSchema.safeParse({ ok: false, message: "secret" }).success).toBe(false);
  });
});
