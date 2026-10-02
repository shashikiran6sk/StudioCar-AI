import sharp from "sharp";

export interface ValidatedProviderCutout {
  height: number;
  width: number;
}

export interface ProviderCutoutExpectations {
  height: number | null;
  maximumPixels: number;
  width: number | null;
}

/**
 * Fully decodes a downloaded cutout and confirms it is one frame of WebP with
 * an alpha channel, within the pixel ceiling, at the dimensions the provider
 * declared. The bytes are kept exactly as received: nothing is re-encoded.
 */
export async function validateProviderCutout(
  bytes: Uint8Array,
  expected: ProviderCutoutExpectations,
): Promise<ValidatedProviderCutout | null> {
  try {
    const image = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: expected.maximumPixels,
      pages: 1,
    });
    const metadata = await image.metadata();
    if (
      metadata.format !== "webp" ||
      !metadata.hasAlpha ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages !== undefined && metadata.pages !== 1) ||
      (expected.width !== null && expected.width !== metadata.width) ||
      (expected.height !== null && expected.height !== metadata.height)
    ) {
      return null;
    }
    await image.stats();
    return { height: metadata.height, width: metadata.width };
  } catch {
    return null;
  }
}
