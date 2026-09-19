import type { ProcessingWorker } from "@studiocar/processing";

import { createImageProcessingWorker } from "./create-image-processing-worker";

let worker: ProcessingWorker | undefined;

export function getImageProcessingWorker(): ProcessingWorker {
  worker ??= createImageProcessingWorker(process.env);
  return worker;
}
