import path from "node:path";

import sharp from "sharp";

import type { RawImage } from "../execution/vehicle-alpha.types";
import { PLATE_ARTWORK_WIDTH, PLATE_ARTWORK_INNER_SHARE, PLATE_ARTWORK_MATTE, PLATE_LOGO_FILE } from "./plate-branding.constants";
import type { PlateBrandingPort, PlateDetector, PlateOverlay } from "./plate-branding.types";
import { findVisiblePlateSurface } from "./find-visible-plate-surface";

export class LocalPlateBranding implements PlateBrandingPort {
  private artwork: Promise<RawImage> | undefined;

  public constructor(private readonly detector: PlateDetector, private readonly assetDirectory: string) {}

  public async prepare(image: RawImage): Promise<PlateOverlay | null> {
    const corners = findVisiblePlateSurface(image, await this.detector.detect(image));
    if (!corners) return null;
    this.artwork ??= this.readArtwork();
    const original = await this.artwork;
    const width = Math.max(
      Math.hypot(corners.topRight.x - corners.topLeft.x, corners.topRight.y - corners.topLeft.y),
      Math.hypot(corners.bottomRight.x - corners.bottomLeft.x, corners.bottomRight.y - corners.bottomLeft.y),
    );
    // Prefilter the wordmark to the plate's pixel scale. Sampling the large
    // original directly into a tiny plate would alias and break thin strokes.
    const { data, info } = await sharp(original.data, {
      raw: { channels: 3, height: original.height, width: original.width },
    }).resize({ width: Math.max(1, Math.ceil(width * PLATE_ARTWORK_INNER_SHARE)), withoutEnlargement: true })
      .raw().toBuffer({ resolveWithObject: true });
    return { artwork: { channels: 3, data, height: info.height, width: info.width }, corners };
  }

  private async readArtwork(): Promise<RawImage> {
    const { data, info } = await sharp(path.join(this.assetDirectory, PLATE_LOGO_FILE))
      .flatten({ background: PLATE_ARTWORK_MATTE }).removeAlpha()
      .resize({ width: PLATE_ARTWORK_WIDTH, withoutEnlargement: true })
      .raw().toBuffer({ resolveWithObject: true });
    return { channels: 3, data, height: info.height, width: info.width };
  }
}
