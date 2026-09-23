import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { StudioFloorIdSchema } from "../../../../../packages/contracts/src/processing";
import { PROCESSING_STUDIO_ASSETS } from "../../../../../workers/image-processing/src/studio-scene/processing-studio-assets.constants";

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "../../../../..");
const WORKER_STUDIO_SOURCES = [
  "workers/image-processing/src/studio-scene/processing-studio-assets.constants.ts",
  "workers/image-processing/src/studio-scene/resolve-studio-scene-asset-keys.ts",
  "workers/image-processing/src/studio-scene/cached-studio-scene-asset-source.ts",
  "workers/image-processing/src/studio-scene/compose-studio-scene.ts",
];

describe("PROCESSING_STUDIO_ASSETS", () => {
  it("names every floor exactly once, with its composition kind", () => {
    expect(Object.keys(PROCESSING_STUDIO_ASSETS.floors).sort()).toEqual(
      [...StudioFloorIdSchema.options].sort(),
    );
    expect(
      Object.values(PROCESSING_STUDIO_ASSETS.floors).filter((floor) => floor.kind === "TURNTABLE"),
    ).toHaveLength(3);
  });

  it("stores bucket-relative, versioned keys only", () => {
    const keys = [
      ...Object.values(PROCESSING_STUDIO_ASSETS.backgrounds),
      ...Object.values(PROCESSING_STUDIO_ASSETS.floors).map((floor) => floor.objectKey),
    ];

    expect(new Set(keys).size).toBe(9);
    for (const key of keys) {
      expect(key).toMatch(/^studio-assets\/v1\/(backgrounds|floors)\/[a-z-]+\.(webp|png)$/);
    }
  });

  it("never reads processing assets from frontend or design locations", async () => {
    for (const source of WORKER_STUDIO_SOURCES) {
      const text = await readFile(path.join(REPOSITORY_ROOT, source), "utf8");

      expect(text).not.toMatch(/\/public\/|public\/studio-assets|docs\/screens|amazonaws\.com|s3:\/\//);
    }
  });
});
