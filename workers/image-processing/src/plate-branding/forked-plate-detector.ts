import { fork } from "node:child_process";

import sharp from "sharp";
import { PLATE_MODEL_INPUT_EDGE, PlateInferenceResponseSchema, type PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import type { PlateDetector } from "./plate-branding.types";
import { PLATE_DETECTOR_ENVIRONMENT, PLATE_DETECTOR_HEAP_MEGABYTES, PLATE_DETECTOR_MATTE, PLATE_DETECTOR_UNAVAILABLE_MESSAGE } from "./plate-branding.constants";

/** No native inference runs in the job process; hangs/crashes are disposable. */
export class ForkedPlateDetector implements PlateDetector {
  public constructor(private readonly entry: string, private readonly timeoutMs: number) {}

  public async detect(image: RawImage): Promise<readonly PlateDetection[]> {
    const pixels = await sharp(image.data, {
      raw: { channels: image.channels, height: image.height, width: image.width },
    }).flatten({ background: PLATE_DETECTOR_MATTE }).removeAlpha()
      .resize(PLATE_MODEL_INPUT_EDGE, PLATE_MODEL_INPUT_EDGE, { fit: "fill" }).raw().toBuffer();
    return new Promise((resolve, reject) => {
      const child = fork(this.entry, [], {
        // Do not forward process arguments, provider credentials or database secrets.
        env: PLATE_DETECTOR_ENVIRONMENT, execArgv: [`--max-old-space-size=${String(PLATE_DETECTOR_HEAP_MEGABYTES)}`],
        serialization: "advanced", stdio: ["ignore", "ignore", "ignore", "ipc"],
      });
      let result: readonly PlateDetection[] | undefined;
      let failure = false;
      const timer = setTimeout(() => {
        failure = true;
        child.kill("SIGKILL");
      }, this.timeoutMs);
      child.once("message", (message: unknown) => {
        const parsed = PlateInferenceResponseSchema.safeParse(message);
        if (parsed.success && parsed.data.ok) result = parsed.data.detections;
        else failure = true;
        // A child which sends but never exits is still killed by the deadline.
      });
      child.once("error", () => { failure = true; });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (!failure && code === 0 && result !== undefined) resolve(result);
        else reject(new Error(PLATE_DETECTOR_UNAVAILABLE_MESSAGE));
      });
      child.send({ pixels }, (error) => {
        if (error) { failure = true; child.kill("SIGKILL"); }
      });
    });
  }
}
