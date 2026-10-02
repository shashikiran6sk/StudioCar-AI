import type { CropMode } from "@studiocar/contracts";

import {
  FIT_OUTPUT_HEIGHT_PIXELS,
  FIT_OUTPUT_WIDTH_PIXELS,
  FIT_VEHICLE_MAXIMUM_ENLARGEMENT,
  SQUARE_OUTPUT_EDGE_PIXELS,
} from "./image-execution.constants";
import type { VehicleFraming } from "./vehicle-framing.types";
import type { SubjectBox } from "./vehicle-alpha.types";

export interface FrameVehicleInput {
  content: SubjectBox;
  crop: CropMode;
  cutoutHeight: number;
  cutoutWidth: number;
  paddingPercent: number;
}

function margin(edge: number, paddingPercent: number): number {
  return Math.round(edge * (paddingPercent / 100));
}

/**
 * Places the cutout on the output canvas.
 *
 * - **Maintain composition** keeps the photo's own frame: the vehicle stays at
 *   exactly its photographed size and position, with the padding added as
 *   background around the frame.
 * - **Fit to vehicle** centres the vehicle and its shadow on a fixed 4:3
 *   canvas inside the padding margin, enlarging at most
 *   `FIT_VEHICLE_MAXIMUM_ENLARGEMENT`.
 * - **Square** fits the whole frame, never enlarged, on a square canvas.
 *
 * The content box includes the provider's shadow, so fitting never crops it.
 */
export function frameVehicle(input: FrameVehicleInput): VehicleFraming {
  if (input.crop === "MAINTAIN_COMPOSITION") {
    const padding = margin(
      Math.min(input.cutoutWidth, input.cutoutHeight),
      input.paddingPercent,
    );
    return {
      canvasHeight: input.cutoutHeight + padding * 2,
      canvasWidth: input.cutoutWidth + padding * 2,
      offsetX: padding,
      offsetY: padding,
      scale: 1,
    };
  }
  if (input.crop === "SQUARE") {
    const inner =
      SQUARE_OUTPUT_EDGE_PIXELS -
      margin(SQUARE_OUTPUT_EDGE_PIXELS, input.paddingPercent) * 2;
    const scale = Math.min(
      inner / input.cutoutWidth,
      inner / input.cutoutHeight,
      1,
    );
    return {
      canvasHeight: SQUARE_OUTPUT_EDGE_PIXELS,
      canvasWidth: SQUARE_OUTPUT_EDGE_PIXELS,
      offsetX: (SQUARE_OUTPUT_EDGE_PIXELS - input.cutoutWidth * scale) / 2,
      offsetY: (SQUARE_OUTPUT_EDGE_PIXELS - input.cutoutHeight * scale) / 2,
      scale,
    };
  }
  const edge = margin(
    Math.min(FIT_OUTPUT_WIDTH_PIXELS, FIT_OUTPUT_HEIGHT_PIXELS),
    input.paddingPercent,
  );
  const scale = Math.min(
    (FIT_OUTPUT_WIDTH_PIXELS - edge * 2) / input.content.width,
    (FIT_OUTPUT_HEIGHT_PIXELS - edge * 2) / input.content.height,
    FIT_VEHICLE_MAXIMUM_ENLARGEMENT,
  );
  return {
    canvasHeight: FIT_OUTPUT_HEIGHT_PIXELS,
    canvasWidth: FIT_OUTPUT_WIDTH_PIXELS,
    offsetX:
      (FIT_OUTPUT_WIDTH_PIXELS - input.content.width * scale) / 2 -
      input.content.left * scale,
    offsetY:
      (FIT_OUTPUT_HEIGHT_PIXELS - input.content.height * scale) / 2 -
      input.content.top * scale,
    scale,
  };
}
