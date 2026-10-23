import path from "node:path";
import { describe, expect, it } from "vitest";

import { LocalPlateBranding } from "../../../../../workers/image-processing/src/plate-branding/local-plate-branding";
import { createPlatePhoto, PHOTO_PLATE } from "../test-support/create-plate-photo";

const ASSETS = path.resolve(process.cwd(), "assets/plate-branding");

describe("local plate branding", () => {
  it("prepares the supplied artwork without stretching it, only after a visible surface is found", async () => {
    const branding = new LocalPlateBranding({ detect: () => Promise.resolve([PHOTO_PLATE]) }, ASSETS);
    const result = await branding.prepare(createPlatePhoto());
    expect(result?.artwork.channels).toBe(3);
    expect(result?.artwork.width).toBeGreaterThan(100);
    expect(result?.artwork.width).toBeLessThan(150);
    if (!result) throw new Error("Expected artwork.");
    expect(result.artwork.width / result.artwork.height).toBeGreaterThan(4.6);
    expect(result.artwork.width / result.artwork.height).toBeLessThan(5.1);
    expect(result?.artwork.data[0]).toBe(0);
    expect(result?.artwork.data.some((value) => value > 200)).toBe(true);
  });
  it("never loads the logo for a missing or unreliable plate", async () => {
    const branding = new LocalPlateBranding({ detect: () => Promise.resolve([]) }, "/missing-artwork");
    await expect(branding.prepare(createPlatePhoto())).resolves.toBeNull();
  });
  it("prepares artwork when an extra badge detection has no plate surface", async () => {
    const badge = { left: 0.1, top: 0.2, width: 0.08, height: 0.04, score: 0.115 };
    const branding = new LocalPlateBranding({ detect: () => Promise.resolve([PHOTO_PLATE, badge]) }, ASSETS);
    expect(await branding.prepare(createPlatePhoto())).not.toBeNull();
  });
  it("does not fabricate an overlay if the detector or logo fails", async () => {
    await expect(new LocalPlateBranding({ detect: () => Promise.reject(new Error("detector")) }, ASSETS).prepare(createPlatePhoto())).rejects.toThrow();
    await expect(new LocalPlateBranding({ detect: () => Promise.resolve([PHOTO_PLATE]) }, "/missing-artwork").prepare(createPlatePhoto())).rejects.toThrow();
  });
});
