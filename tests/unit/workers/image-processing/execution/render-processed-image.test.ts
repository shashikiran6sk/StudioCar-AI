import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { renderProcessedImage } from "../../../../../workers/image-processing/src/execution/render-processed-image";

describe("renderProcessedImage", () => {
  it("renders the requested output and a bounded WebP preview", async () => {
    const bytes = await sharp({
      create: {
        background: { alpha: 0.6, b: 20, g: 30, r: 40 },
        channels: 4,
        height: 400,
        width: 800,
      },
    })
      .webp()
      .toBuffer();
    const result = await renderProcessedImage({
      bytes,
      options: {
        background: "DARK_STUDIO",
        floor: "HORIZON",
        crop: "SQUARE",
        enhancement: false,
        outputFormat: "PNG",
        paddingPercent: 0,
        platePrivacy: false,
        quality: 85,
        shadow: "NONE",
      },
      previewMaxWidth: 320,
    });
    const preview = await sharp(result.previewBytes).metadata();

    expect(result.contentType).toBe("image/png");
    expect(result.width).toBeLessThanOrEqual(1_600);
    expect(result.height).toBeLessThanOrEqual(1_600);
    expect(preview.format).toBe("webp");
    expect(preview.width).toBeLessThanOrEqual(320);
  });

  /** A "car": an opaque block standing in a transparent 800×500 frame. */
  async function cutout(): Promise<Buffer> {
    const body = await sharp({
      create: { background: { alpha: 1, b: 60, g: 60, r: 200 }, channels: 4, height: 200, width: 400 },
    }).png().toBuffer();
    return sharp({
      create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: 500, width: 800 },
    })
      .composite([{ input: body, left: 200, top: 250 }])
      .png()
      .toBuffer();
  }

  async function render(
    floor: "PLAIN" | "HORIZON",
    shadow: "NONE" | "NATURAL" = "NATURAL",
  ) {
    const result = await renderProcessedImage({
      bytes: await cutout(),
      options: {
        background: "PREMIUM_WHITE",
        floor,
        crop: "MAINTAIN_COMPOSITION",
        enhancement: false,
        outputFormat: "PNG",
        paddingPercent: 0,
        platePrivacy: false,
        quality: 90,
        shadow,
      },
      previewMaxWidth: 320,
    });
    return sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
  }

  function pixel(
    image: { data: Buffer; info: { channels: number; width: number } },
    x: number,
    y: number,
  ): number {
    // Luminance-ish: the red channel is enough to tell wall from floor.
    return image.data[(y * image.info.width + x) * image.info.channels] ?? 0;
  }

  it("draws a studio with a lighter wall above a grey floor", async () => {
    const image = await render("HORIZON");

    // The car's tyre line is y=450; the horizon sits above it.
    const wall = pixel(image, 20, 40);
    const floor = pixel(image, 20, 480);
    expect(wall).toBeGreaterThan(235);
    expect(floor).toBeLessThan(wall - 20);
  });

  it("keeps the vehicle itself untouched in front of the scene", async () => {
    const image = await render("HORIZON");

    expect(pixel(image, 400, 350)).toBe(200);
  });

  it("draws no floor for a plain background", async () => {
    const plain = await render("PLAIN");

    // Below the tyre line the plain background keeps its single colour.
    expect(pixel(plain, 20, 480)).toBe(pixel(plain, 20, 40));
    expect(pixel(plain, 20, 480)).toBe(250);
    expect(pixel(plain, 400, 350)).toBe(200);
  });

  it("draws a contact shadow only when a shadow is requested", async () => {
    const withShadow = await render("HORIZON", "NATURAL");
    const without = await render("HORIZON", "NONE");

    // Just below the tyre line, where the shadow falls.
    expect(pixel(withShadow, 400, 456)).toBeLessThan(pixel(without, 400, 456));
  });

  /** How many pixels of the red "car" body one row of the output crosses. */
  function carWidth(
    image: { data: Buffer; info: { channels: number; height: number; width: number } },
  ): number {
    let widest = 0;
    for (let y = 0; y < image.info.height; y++) {
      let row = 0;
      for (let x = 0; x < image.info.width; x++) {
        const index = (y * image.info.width + x) * image.info.channels;
        if ((image.data[index] ?? 0) > 150 && (image.data[index + 1] ?? 255) < 100) row++;
      }
      widest = Math.max(widest, row);
    }
    return widest;
  }

  it("fits a studio vehicle 30% larger, and never enlarges an original photo", async () => {
    const fitted = async (background: "ORIGINAL" | "PREMIUM_WHITE") => {
      const result = await renderProcessedImage({
        bytes: await cutout(),
        options: {
          background,
          floor: "PLAIN",
          crop: "FIT_VEHICLE",
          enhancement: false,
          outputFormat: "PNG",
          paddingPercent: 0,
          platePrivacy: false,
          quality: 90,
          shadow: "NONE",
        },
        previewMaxWidth: 320,
      });
      return sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
    };

    const studio = await fitted("PREMIUM_WHITE");
    const original = await fitted("ORIGINAL");
    expect([studio.info.width, studio.info.height]).toEqual([1_600, 1_200]);
    expect(carWidth(studio)).toBe(520);
    expect(carWidth(original)).toBe(400);
  });
});
