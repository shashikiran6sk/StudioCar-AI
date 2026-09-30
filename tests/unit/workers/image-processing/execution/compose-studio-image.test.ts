import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { composeStudioImage } from "../../../../../workers/image-processing/src/execution/compose-studio-image";
import { NoVehicleDetectedError } from "../../../../../workers/image-processing/src/execution/no-vehicle-detected-error";
import { STUDIO_BACKGROUND_ASSETS } from "../../../../../workers/image-processing/src/execution/studio-background.constants";
import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";
import {
  BODY_COLOUR,
  createCutout,
  DEFAULT_CUTOUT,
  pixel,
} from "../test-support/create-cutout";
import { loadStudioBackground } from "../test-support/load-studio-background";

const MAINTAIN = { crop: "MAINTAIN_COMPOSITION", enhancement: false, paddingPercent: 8 } as const;
const PADDING = 32;

/** Rows where the composed image changes brightness most sharply, top first. */
function seamRow(image: RawImage, column: number): number {
  let best = 0;
  let seam = -1;
  for (let y = 1; y < image.height; y += 1) {
    const jump = Math.abs(pixel(image, column, y)[0]! - pixel(image, column, y - 1)[0]!);
    if (jump > best) {
      best = jump;
      seam = y;
    }
  }
  return seam;
}

describe("composeStudioImage", () => {
  let greyFloor: Buffer;
  let greyPlain: Buffer;

  beforeAll(async () => {
    greyFloor = await loadStudioBackground("GREY_STUDIO", "HORIZON");
    greyPlain = await loadStudioBackground("GREY_STUDIO", "PLAIN");
  });

  it("keeps the photographed vehicle exactly where it was, inside the padding", async () => {
    const image = await composeStudioImage({
      background: "GREY_STUDIO",
      backgroundBytes: greyPlain,
      cutout: createCutout(),
      floor: "PLAIN",
      options: MAINTAIN,
    });
    expect(image).toMatchObject({ channels: 3, height: 464, width: 704 });
    const { body } = DEFAULT_CUTOUT;
    expect(pixel(image, body.left + PADDING + 5, body.top + PADDING + 5)).toEqual([
      BODY_COLOUR.r,
      BODY_COLOUR.g,
      BODY_COLOUR.b,
    ]);
    expect(pixel(image, body.left + PADDING - 1, body.top + PADDING + 5)).not.toEqual([
      BODY_COLOUR.r,
      BODY_COLOUR.g,
      BODY_COLOUR.b,
    ]);
  });

  it("draws only the provider's shadow: no second, local shadow", async () => {
    const image = await composeStudioImage({
      background: "GREY_STUDIO",
      backgroundBytes: greyPlain,
      cutout: createCutout(),
      floor: "PLAIN",
      options: MAINTAIN,
    });
    const background = pixel(image, 5, 5);
    const { body, shadow } = DEFAULT_CUTOUT;
    const shadowY = body.top + body.height + PADDING + Math.floor(shadow.depth / 2);
    // Under the provider shadow: background darkened by exactly its alpha.
    const expected = background.map((channel) =>
      Math.round(channel * (1 - shadow.alpha / 255)),
    );
    pixel(image, body.left + PADDING + 50, shadowY).forEach((channel, index) => {
      expect(Math.abs(channel - (expected[index] ?? 0))).toBeLessThanOrEqual(1);
    });
    // Just outside the provider shadow: untouched background.
    expect(pixel(image, body.left + PADDING + 50, shadowY + shadow.depth)).toEqual(background);
    expect(
      pixel(image, body.left - shadow.overhang + PADDING - 3, shadowY),
    ).toEqual(background);
  });

  it("places the floor seam above the tyre line so the vehicle stands on the floor", async () => {
    const image = await composeStudioImage({
      background: "GREY_STUDIO",
      backgroundBytes: greyFloor,
      cutout: createCutout(),
      floor: "HORIZON",
      options: MAINTAIN,
    });
    const { body } = DEFAULT_CUTOUT;
    const tyreLine = body.top + body.height + PADDING;
    const expectedSeam = Math.round(tyreLine - body.height * 0.3);
    // Measured left of the vehicle and its shadow.
    expect(Math.abs(seamRow(image, 10) - expectedSeam)).toBeLessThanOrEqual(2);
    expect(seamRow(image, 10)).toBeLessThan(tyreLine);
  });

  it("centres a fitted vehicle and its shadow on a 1600×1200 canvas", async () => {
    const image = await composeStudioImage({
      background: "GREY_STUDIO",
      backgroundBytes: greyPlain,
      cutout: createCutout(),
      floor: "PLAIN",
      options: { ...MAINTAIN, crop: "FIT_VEHICLE" },
    });
    expect(image).toMatchObject({ height: 1_200, width: 1_600 });
    const bodyColour = [BODY_COLOUR.r, BODY_COLOUR.g, BODY_COLOUR.b];
    const isBody = (x: number, y: number) =>
      pixel(image, x, y).every(
        (channel, index) => Math.abs(channel - (bodyColour[index] ?? 0)) <= 2,
      );
    let left = image.width;
    let right = -1;
    for (let x = 0; x < image.width; x += 1) {
      if (!isBody(x, 540)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    let top = image.height;
    let bottom = -1;
    for (let y = 0; y < image.height; y += 1) {
      if (!isBody(800, y)) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    // Body 400×160 px × 1.3 = 520×208 px, centred with its shadow's symmetric
    // overhang. Resampling softens about a pixel and a half at each edge.
    const width = right - left + 1;
    const height = bottom - top + 1;
    expect(Math.abs(width - 520)).toBeLessThanOrEqual(4);
    expect(Math.abs(height - 208)).toBeLessThanOrEqual(4);
    expect(width / height).toBeCloseTo(400 / 160, 1);
    expect(Math.abs((left + right) / 2 - 800)).toBeLessThanOrEqual(2);
  });

  it("enhances the vehicle without changing a single background pixel", async () => {
    // A flat, low-contrast body gives the levels stretch something to do.
    const cutout = createCutout();
    for (let index = 0; index < cutout.data.length; index += 4) {
      if (cutout.data[index + 3] === 255) {
        const x = (index / 4) % cutout.width;
        cutout.data.fill(90 + (x % 60), index, index + 3);
      }
    }
    const input = { background: "GREY_STUDIO", backgroundBytes: greyFloor, cutout, floor: "HORIZON" } as const;
    const plain = await composeStudioImage({ ...input, options: MAINTAIN });
    const enhanced = await composeStudioImage({ ...input, options: { ...MAINTAIN, enhancement: true } });
    const alpha = createCutout();
    let vehicleChanged = 0;
    for (let y = 0; y < plain.height; y += 1) {
      for (let x = 0; x < plain.width; x += 1) {
        const cx = x - PADDING;
        const cy = y - PADDING;
        const inside = cx >= 0 && cy >= 0 && cx < alpha.width && cy < alpha.height;
        const a = inside ? (alpha.data[(cy * alpha.width + cx) * 4 + 3] ?? 0) : 0;
        const same = pixel(plain, x, y).join() === pixel(enhanced, x, y).join();
        if (a === 0) expect(same).toBe(true);
        else if (a === 255 && !same) vehicleChanged += 1;
      }
    }
    expect(vehicleChanged).toBeGreaterThan(40_000);
  });

  it.each(
    (["PREMIUM_WHITE", "GREY_STUDIO", "DARK_STUDIO"] as const).flatMap((background) =>
      (["PLAIN", "HORIZON"] as const).map((floor) => [background, floor] as const),
    ),
  )("composes %s with the %s floor from its own artwork", async (background, floor) => {
    const image = await composeStudioImage({
      background,
      backgroundBytes: await loadStudioBackground(background, floor),
      cutout: createCutout(),
      floor,
      options: MAINTAIN,
    });
    const artwork = await sharp(await loadStudioBackground(background, floor))
      .extract({ height: 1, left: 1_920, top: 400, width: 1 })
      .raw()
      .toBuffer();
    // Top-centre wall pixel matches the artwork's wall within resampling noise.
    pixel(image, 352, 2).forEach((channel, index) => {
      expect(Math.abs(channel - (artwork[index] ?? 0))).toBeLessThanOrEqual(8);
    });
    expect(STUDIO_BACKGROUND_ASSETS[background][floor].seamY === null).toBe(floor === "PLAIN");
  });

  it("reports a cutout without a vehicle", async () => {
    await expect(
      composeStudioImage({
        background: "GREY_STUDIO",
        backgroundBytes: greyPlain,
        cutout: { channels: 4, data: Buffer.alloc(64 * 48 * 4), height: 48, width: 64 },
        floor: "PLAIN",
        options: MAINTAIN,
      }),
    ).rejects.toBeInstanceOf(NoVehicleDetectedError);
  });
});
