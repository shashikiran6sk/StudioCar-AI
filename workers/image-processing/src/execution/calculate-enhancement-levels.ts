import {
  ENHANCEMENT_HIGH_PERCENTILE,
  ENHANCEMENT_LOW_PERCENTILE,
  ENHANCEMENT_MAXIMUM_GAIN,
  ENHANCEMENT_MINIMUM_RANGE,
  ENHANCEMENT_SAMPLE_STRIDE,
  VEHICLE_ALPHA_THRESHOLD,
} from "./image-execution.constants";
import type { RawImage } from "./vehicle-alpha.types";

export interface EnhancementLevels {
  gain: number;
  offset: number;
}

const LEVELS = 256;

/**
 * An auto-levels stretch measured on the vehicle's own pixels only: its
 * luminance between the low and high percentiles is spread across the full
 * range, with bounded gain. Background, shadow and transparent pixels never
 * influence it, so the same car enhances the same way on every background.
 * Null when the vehicle's range is already full, or too narrow to stretch.
 */
export function calculateEnhancementLevels(
  cutout: RawImage,
): EnhancementLevels | null {
  if (cutout.channels !== 4) return null;
  const histogram = new Uint32Array(LEVELS);
  let samples = 0;
  const pixels = cutout.width * cutout.height;
  for (let pixel = 0; pixel < pixels; pixel += ENHANCEMENT_SAMPLE_STRIDE) {
    const index = pixel * 4;
    if ((cutout.data[index + 3] ?? 0) < VEHICLE_ALPHA_THRESHOLD) continue;
    const luminance = Math.round(
      0.2126 * (cutout.data[index] ?? 0) +
        0.7152 * (cutout.data[index + 1] ?? 0) +
        0.0722 * (cutout.data[index + 2] ?? 0),
    );
    histogram[luminance] = (histogram[luminance] ?? 0) + 1;
    samples += 1;
  }
  if (samples === 0) return null;
  const percentile = (share: number): number => {
    const target = share * samples;
    let seen = 0;
    for (let level = 0; level < LEVELS; level += 1) {
      seen += histogram[level] ?? 0;
      if (seen >= target) return level;
    }
    return LEVELS - 1;
  };
  const low = percentile(ENHANCEMENT_LOW_PERCENTILE);
  const high = percentile(ENHANCEMENT_HIGH_PERCENTILE);
  const range = high - low;
  if (range < ENHANCEMENT_MINIMUM_RANGE) return null;
  const gain = Math.min(ENHANCEMENT_MAXIMUM_GAIN, (LEVELS - 1) / range);
  if (gain <= 1 && low === 0) return null;
  return { gain, offset: -low * gain };
}
