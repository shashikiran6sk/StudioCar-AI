import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { createVehicleShadow } from "../../../../../workers/image-processing/src/execution/create-vehicle-shadow";
import { readVehicleAlpha } from "../../../../../workers/image-processing/src/execution/read-vehicle-alpha";

async function frame(path: string, width = 300, height = 200): Promise<Buffer> {
  return sharp(
    Buffer.from(
      `<svg width="${width}" height="${height}"><path d="${path}" fill="red"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
}

const poses = [
  "M80 70 H220 V145 H80 Z", // front
  "M90 60 H210 V145 H90 Z", // rear
  "M30 90 H250 V140 H30 Z", // side
  "M40 100 L100 60 L250 90 V130 L200 145 H50 Z", // front-left
  "M260 100 L200 60 L50 90 V130 L100 145 H250 Z", // front-right
  "M40 85 L200 60 L250 100 V145 H100 L40 130 Z", // rear-left
  "M260 85 L100 60 L50 100 V145 H200 L260 130 Z", // rear-right
  "M20 50 H280 V150 H20 Z", // large
  "M110 100 H190 V140 H110 Z", // small
  "M5 90 H160 V145 H5 Z", // off-center
];

describe("createVehicleShadow", () => {
  it.each(poses)("grounds pose %s with soft bounded alpha", async (path) => {
    const alpha = await readVehicleAlpha(await frame(path));
    const shadow = await createVehicleShadow(alpha, "NATURAL");
    expect(shadow).not.toBeNull();
    if (shadow === null) throw new Error("Missing shadow");
    const { data, info } = await sharp(shadow)
      .extractChannel("alpha")
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(300);
    expect(info.height).toBe(200);
    expect(Math.max(...data)).toBeGreaterThan(10);
    expect(Math.max(...data)).toBeLessThan(130);
    expect(data.subarray(0, 300).every((value) => value === 0)).toBe(true);
    expect(data.subarray(199 * 300).every((value) => value === 0)).toBe(true);
    expect(data.subarray(0, 40 * 300).every((value) => value === 0)).toBe(true);
  });
  it("omits disabled and empty shadows", async () => {
    const alpha = await readVehicleAlpha(await frame(poses[0] ?? ""));
    expect(await createVehicleShadow(alpha, "NONE")).toBeNull();
    expect(
      await createVehicleShadow({ ...alpha, subject: null }, "NATURAL"),
    ).toBeNull();
  });
});
