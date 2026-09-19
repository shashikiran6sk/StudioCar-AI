import sharp from "sharp";

import {
  INVALID_SOURCE_IMAGE_MESSAGE,
  SOURCE_MIME_MISMATCH_MESSAGE,
  UNSUPPORTED_SOURCE_IMAGE_MESSAGE,
} from "./image-execution.constants";
import type { SourceImageValidationResult } from "./image-execution.types";

function toSupportedContentType(
  format: string | undefined,
): "image/jpeg" | "image/png" | "image/webp" | undefined {
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return undefined;
}

export async function inspectSourceImage(
  bytes: Uint8Array,
  committedContentType: string,
  maximumPixels: number,
): Promise<SourceImageValidationResult> {
  try {
    const image = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: maximumPixels,
      pages: 1,
      sequentialRead: true,
    });
    const metadata = await image.metadata();
    const contentType = toSupportedContentType(metadata.format);
    if (!contentType) {
      return {
        ok: false,
        failureKind: "UNSUPPORTED_FORMAT",
        message: UNSUPPORTED_SOURCE_IMAGE_MESSAGE,
      };
    }
    if (contentType !== committedContentType) {
      return {
        ok: false,
        failureKind: "INVALID_IMAGE",
        message: SOURCE_MIME_MISMATCH_MESSAGE,
      };
    }
    if (
      !metadata.width ||
      !metadata.height ||
      (metadata.pages !== undefined && metadata.pages !== 1) ||
      metadata.width * metadata.height > maximumPixels
    ) {
      return {
        ok: false,
        failureKind: "INVALID_IMAGE",
        message: INVALID_SOURCE_IMAGE_MESSAGE,
      };
    }

    await image.clone().stats();
    return {
      ok: true,
      image: {
        bytes,
        contentType,
        height: metadata.height,
        width: metadata.width,
      },
    };
  } catch {
    return {
      ok: false,
      failureKind: "INVALID_IMAGE",
      message: INVALID_SOURCE_IMAGE_MESSAGE,
    };
  }
}
