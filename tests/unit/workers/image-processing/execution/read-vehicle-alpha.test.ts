import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { readVehicleAlpha } from "../../../../../workers/image-processing/src/execution/read-vehicle-alpha";

describe("readVehicleAlpha", () => {
  it("reads one alpha channel independently of foreground colour", async () => {
    const bytes = await sharp({
      create: {
        width: 10,
        height: 8,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const alpha = await readVehicleAlpha(bytes);
    expect(alpha.pixels.length).toBe(80);
    expect(alpha.pixels[0]).toBe(255);
    expect(alpha.subject).toEqual({ left: 0, top: 0, width: 10, height: 8 });
  });
});
