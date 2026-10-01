/** A pixel rectangle: left/top inclusive, width/height in pixels. */
export interface SubjectBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A decoded image as raw interleaved channels. */
export interface RawImage {
  channels: 3 | 4;
  data: Buffer;
  height: number;
  width: number;
}

/** Where a provider cutout's vehicle and shadow are, from its alpha alone. */
export interface CutoutMeasurement {
  /** Vehicle plus faint shadow and edge alpha: what must never be cropped. */
  content: SubjectBox;
  /** Strong alpha only: the vehicle body, excluding its ground shadow. */
  vehicle: SubjectBox;
  /** Share of the frame covered by the vehicle body, 0–1. */
  vehicleCoverage: number;
}
