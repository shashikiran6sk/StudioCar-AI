import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/src/app",
);

describe("SEO image assets", () => {
  it("provides a multi-resolution favicon and correctly sized social and browser icons", () => {
    const favicon = readFileSync(path.join(appDirectory, "favicon.ico"));
    expect(favicon.readUInt16LE(2)).toBe(1);
    expect(favicon.readUInt16LE(4)).toBeGreaterThanOrEqual(3);

    for (const [file, width, height] of [
      ["icon.png", 512, 512],
      ["apple-icon.png", 180, 180],
      ["opengraph-image.png", 1200, 630],
    ] satisfies [string, number, number][]) {
      const image = readFileSync(path.join(appDirectory, file));
      expect(image.subarray(1, 4).toString()).toBe("PNG");
      expect(image.readUInt32BE(16)).toBe(width);
      expect(image.readUInt32BE(20)).toBe(height);
    }
  });
});
