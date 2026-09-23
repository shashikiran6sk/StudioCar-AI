import type { ProcessingOptions } from "@studiocar/contracts";

import type { StudioSceneAssets } from "../studio-scene/studio-scene.types";

export interface ValidatedSourceImage {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  height: number;
  width: number;
}

export type SourceImageValidationResult =
  | { ok: true; image: ValidatedSourceImage }
  | {
      ok: false;
      failureKind: "INVALID_IMAGE" | "UNSUPPORTED_FORMAT";
      message: string;
    };

export interface RenderProcessedImageInput {
  bytes: Uint8Array;
  options: ProcessingOptions;
  previewMaxWidth: number;
  /** The studio's layers; required for every background except `ORIGINAL`. */
  scene: StudioSceneAssets | null;
}

export interface RenderedProcessedImage {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  height: number;
  previewBytes: Uint8Array;
  width: number;
}
