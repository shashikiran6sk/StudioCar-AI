import { describe, expect, it } from "vitest";

import { createUniqueFilename } from "../../../../apps/web/src/features/portfolio/create-unique-filename";

describe("createUniqueFilename", () => {
  it("keeps a name nobody has taken", () => {
    const taken = new Set<string>();
    expect(createUniqueFilename("processed-01.webp", taken)).toBe("processed-01.webp");
    expect(taken.has("processed-01.webp")).toBe(true);
  });

  it("numbers repeats before the extension", () => {
    const taken = new Set<string>();
    createUniqueFilename("processed-01.webp", taken);
    expect(createUniqueFilename("processed-01.webp", taken)).toBe("processed-01-2.webp");
    expect(createUniqueFilename("processed-01.webp", taken)).toBe("processed-01-3.webp");
  });

  it("numbers a name without an extension", () => {
    const taken = new Set(["image"]);
    expect(createUniqueFilename("image", taken)).toBe("image-2");
  });
});
