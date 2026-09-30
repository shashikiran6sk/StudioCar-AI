import type { BackgroundTreatment, FloorStyle } from "@studiocar/contracts";

/** The backgrounds StudioCar owns and composes a vehicle onto. */
export type StudioBackground = Exclude<BackgroundTreatment, "ORIGINAL">;

export interface StudioBackgroundAsset {
  /** File name inside the packaged background directory. */
  file: string;
  height: number;
  /** First floor row, or null for a background without a floor. */
  seamY: number | null;
  width: number;
}

export type StudioBackgroundAssets = Readonly<
  Record<StudioBackground, Readonly<Record<FloorStyle, StudioBackgroundAsset>>>
>;

/** Reads a packaged background file's bytes. */
export interface StudioBackgroundSource {
  read(file: string): Promise<Uint8Array>;
}

/** The asset region, in asset pixels, that fills the whole output canvas. */
export interface BackgroundPlacement {
  height: number;
  left: number;
  top: number;
  width: number;
}
