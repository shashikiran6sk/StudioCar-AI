import { describe, expect, it } from "vitest";

import { layoutStudioScene } from "../../../../../workers/image-processing/src/studio-scene/layout-studio-scene";
import {
  STUDIO_FLOOR_LAYOUT,
  STUDIO_STAGE,
  TURNTABLE_LAYOUT,
} from "../../../../../workers/image-processing/src/studio-scene/studio-scene-geometry.constants";

const FOOTPRINT = {
  body: { left: 100, top: 100, width: 400, height: 200 },
  extent: { left: 100, top: 100, width: 400, height: 220 },
};

function tyreLine(layout: ReturnType<typeof layoutStudioScene>): number {
  if (!layout.vehicle) throw new Error("Expected a vehicle.");
  return layout.vehicle.top + (FOOTPRINT.body.height) * layout.vehicleScale;
}

describe("layoutStudioScene", () => {
  it("stands the tyres on the standard floor's contact line", () => {
    const layout = layoutStudioScene({
      crop: "FIT_VEHICLE",
      cutout: { width: 600, height: 400 },
      floorKind: "STUDIO_FLOOR",
      footprint: FOOTPRINT,
    });

    expect(tyreLine(layout) / layout.window.height).toBeCloseTo(
      STUDIO_FLOOR_LAYOUT.contactY,
      2,
    );
    expect(layout.window.width / layout.window.height).toBeCloseTo(16 / 9, 2);
  });

  it("stands the tyres on the turntable's surface, centred on the platform", () => {
    const layout = layoutStudioScene({
      crop: "FIT_VEHICLE",
      cutout: { width: 600, height: 400 },
      floorKind: "TURNTABLE",
      footprint: FOOTPRINT,
    });
    const contact =
      TURNTABLE_LAYOUT.centerY + TURNTABLE_LAYOUT.contactDepth * TURNTABLE_LAYOUT.radiusY;
    const vehicle = layout.vehicle;
    if (!vehicle) throw new Error("Expected a vehicle.");

    expect(tyreLine(layout) / layout.window.height).toBeCloseTo(contact, 2);
    expect((vehicle.left + vehicle.width / 2) / layout.window.width).toBeCloseTo(0.5, 2);
    // The vehicle fits on the platform.
    expect(vehicle.width / layout.window.width).toBeLessThanOrEqual(
      2 * TURNTABLE_LAYOUT.radiusX + 0.001,
    );
  });

  it("never enlarges the vehicle; a small photo makes a smaller scene", () => {
    const layout = layoutStudioScene({
      crop: "FIT_VEHICLE",
      cutout: { width: 600, height: 400 },
      floorKind: "STUDIO_FLOOR",
      footprint: FOOTPRINT,
    });

    expect(layout.vehicleScale).toBe(1);
    expect(layout.window.width).toBeLessThan(STUDIO_STAGE.width);
  });

  it("scales a large vehicle down to the full-resolution stage", () => {
    const layout = layoutStudioScene({
      crop: "FIT_VEHICLE",
      cutout: { width: 12_000, height: 8_000 },
      floorKind: "STUDIO_FLOOR",
      footprint: {
        body: { left: 2_000, top: 2_000, width: 8_000, height: 4_000 },
        extent: { left: 2_000, top: 2_000, width: 8_000, height: 4_200 },
      },
    });

    expect(layout.vehicleScale).toBeLessThan(1);
    expect(layout.window).toMatchObject({ width: STUDIO_STAGE.width, height: STUDIO_STAGE.height });
  });

  it("keeps the photo's shape and the whole platform when maintaining composition", () => {
    const layout = layoutStudioScene({
      crop: "MAINTAIN_COMPOSITION",
      cutout: { width: 450, height: 550 },
      floorKind: "TURNTABLE",
      footprint: FOOTPRINT,
    });
    const platformWidth =
      2 * TURNTABLE_LAYOUT.radiusX * layout.stage.width;

    expect(layout.window.width / layout.window.height).toBeCloseTo(450 / 550, 2);
    // A tall frame grows upward instead of cutting the platform off.
    expect(layout.window.width).toBeGreaterThan(platformWidth);
    expect(layout.window.top).toBeLessThan(0);
  });

  it("frames an empty scene at the cutout's size when there is no vehicle", () => {
    const layout = layoutStudioScene({
      crop: "SQUARE",
      cutout: { width: 600, height: 400 },
      floorKind: "STUDIO_FLOOR",
      footprint: null,
    });

    expect(layout.vehicle).toBeNull();
    expect(layout.contactShadow).toBeNull();
    expect(layout.window.width).toBe(layout.window.height);
  });
});
