import type { SupportedImageMimeType } from "@studiocar/contracts";

export interface ImageMetadata {
  mimeType: SupportedImageMimeType;
  width: number;
  height: number;
}
