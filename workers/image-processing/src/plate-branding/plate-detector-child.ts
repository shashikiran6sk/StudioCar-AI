import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { InferenceSession, Tensor } from "onnxruntime-node";
import { PLATE_MODEL_INPUT_EDGE, PLATE_MODEL_RGB_BYTES, PlateInferenceRequestSchema, type PlateInferenceResponse } from "@studiocar/contracts";

import { PLATE_MODEL_FILE, PLATE_MODEL_SHA256 } from "./plate-branding.constants";
import { parsePlateModelOutput } from "./parse-plate-model-output";
import { resolvePlateBrandingPaths } from "../runtime/resolve-plate-branding-paths";

/** One image per child. Exit frees native model memory before composition. */
process.once("message", (message: unknown) => {
  void infer(message).then(send, () => { send({ ok: false }); });
});

function send(response: PlateInferenceResponse): void {
  if (!process.send) process.exit(1);
  process.send(response, () => process.exit(0));
}

async function infer(message: unknown): Promise<PlateInferenceResponse> {
  const { pixels } = PlateInferenceRequestSchema.parse(message);
  const paths = resolvePlateBrandingPaths(import.meta.url, existsSync);
  const model = await readFile(path.join(paths.assets, PLATE_MODEL_FILE));
  if (createHash("sha256").update(model).digest("hex") !== PLATE_MODEL_SHA256) {
    return { ok: false };
  }
  const session = await InferenceSession.create(model, {
    executionProviders: ["cpu"], intraOpNumThreads: 1, interOpNumThreads: 1,
    logSeverityLevel: 4,
  });
  try {
    const plane = PLATE_MODEL_INPUT_EDGE ** 2;
    const input = new Float32Array(PLATE_MODEL_RGB_BYTES);
    for (let channel = 0; channel < 3; channel++) {
      for (let pixel = 0; pixel < plane; pixel++) {
        input[channel * plane + pixel] = (pixels[pixel * 3 + channel] ?? 0) / 255;
      }
    }
    const output = await session.run({
      pixel_values: new Tensor("float32", input, [1, 3, PLATE_MODEL_INPUT_EDGE, PLATE_MODEL_INPUT_EDGE]),
    });
    const logits = output.logits;
    const boxes = output.pred_boxes;
    if (!(logits?.data instanceof Float32Array) || !(boxes?.data instanceof Float32Array)) return { ok: false };
    return { detections: parsePlateModelOutput(logits.data, boxes.data), ok: true };
  } finally {
    await session.release();
  }
}
