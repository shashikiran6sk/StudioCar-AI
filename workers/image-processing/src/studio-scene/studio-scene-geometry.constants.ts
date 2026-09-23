/**
 * The geometry every v1 studio asset is drawn to. The asset generator draws
 * from these same values, so the compositor always knows exactly where the
 * floor meets the wall and where the turntable's surface is.
 *
 * Positions are fractions of the stage: `x` of its width, `y` of its height.
 */
export const STUDIO_STAGE = {
  width: 3_840,
  height: 2_160,
};

/** Where the wall blends into the floor, as in a curved studio cove. */
export const STUDIO_HORIZON = {
  y: 0.6,
  blendHeight: 0.12,
};

/** A flat floor that runs to the edges of the frame. */
export const STUDIO_FLOOR_LAYOUT = {
  /** Where the tyres meet the floor. */
  contactY: 0.84,
  maximumVehicleWidth: 0.74,
  maximumVehicleHeight: 0.6,
  /** The narrowest crop that still reads as a studio floor. */
  minimumWindowWidth: 0.6,
  /** The widest the vehicle may be within a cropped frame. */
  maximumWindowFill: 0.9,
};

/** A round platform seen in perspective. */
export const TURNTABLE_LAYOUT = {
  centerX: 0.5,
  centerY: 0.78,
  radiusX: 1 / 3,
  radiusY: 1 / 9,
  /** The visible thickness of the platform's front edge. */
  rimDepth: 0.026,
  /** How far the platform's shadow spreads beyond its edge, sideways. */
  castShadowSpread: 1.04,
  /**
   * Where the nearest tyre stands: this fraction of the surface's depth in
   * front of its centre, so every wheel is on the platform.
   */
  contactDepth: 0.45,
  /** The vehicle's width as a fraction of the platform's. */
  vehicleCoverage: 0.9,
  maximumVehicleHeight: 0.58,
  /** Space kept beside the platform when the frame is cropped. */
  windowMargin: 0.03,
};
