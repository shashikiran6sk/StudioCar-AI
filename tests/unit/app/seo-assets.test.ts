import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/src/app",
);
const publicDirectory = path.resolve(appDirectory, "../../public");

describe("SEO image assets", () => {
  it("provides a multi-resolution favicon and correctly sized social and browser icons", () => {
    const favicon = readFileSync(path.join(publicDirectory, "favicon.ico"));
    expect(favicon.readUInt16LE(2)).toBe(1);
    expect(favicon.readUInt16LE(4)).toBeGreaterThanOrEqual(3);

    const sizes = Array.from({ length: favicon.readUInt16LE(4) }, (_, index) => {
      const entry = 6 + index * 16;
      const offset = favicon.readUInt32LE(entry + 12);
      const width = favicon.readUInt8(entry);
      const height = favicon.readUInt8(entry + 1);
      expect(width).toBe(height);
      expect(favicon.readUInt32BE(offset + 16)).toBe(width);
      expect(favicon.readUInt32BE(offset + 20)).toBe(height);
      return width;
    });
    expect(sizes).toEqual([16, 32, 48]);

    for (const [directory, file, width, height] of [
      [publicDirectory, "icon.png", 192, 192],
      [appDirectory, "apple-icon.png", 180, 180],
      [appDirectory, "opengraph-image.png", 1200, 630],
    ] satisfies [string, string, number, number][]) {
      const image = readFileSync(path.join(directory, file));
      expect(image.subarray(1, 4).toString()).toBe("PNG");
      expect(image.readUInt32BE(16)).toBe(width);
      expect(image.readUInt32BE(20)).toBe(height);
    }
  });

  it("avoids automatic App Router icon metadata overriding the declared sizes", () => {
    for (const file of ["favicon.ico", "icon.png"]) {
      expect(() => readFileSync(path.join(appDirectory, file))).toThrow();
    }
  });
});
