import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { STUDIO_FLOOR_IDS_BY_BACKGROUND } from "../../../../packages/contracts/src/processing";
import { STUDIO_BACKGROUND_CHOICES } from "../../../../apps/web/src/features/studio-treatment/studio-treatment.constants";

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "../../../..");
const PUBLIC_ROOT = path.join(REPOSITORY_ROOT, "apps/web/public");

describe("STUDIO_BACKGROUND_CHOICES", () => {
  it("offers Premium White, Dark Studio and Grey Studio only", () => {
    expect(STUDIO_BACKGROUND_CHOICES.map((choice) => choice.label)).toEqual([
      "Premium White",
      "Dark Studio",
      "Grey Studio",
    ]);
  });

  it("offers exactly each background's own two floors", () => {
    for (const choice of STUDIO_BACKGROUND_CHOICES) {
      expect(choice.floors.map((floor) => floor.id)).toEqual(
        STUDIO_FLOOR_IDS_BY_BACKGROUND[choice.id],
      );
    }
  });

  it("previews from bundled files that exist, never from object storage", async () => {
    const paths = STUDIO_BACKGROUND_CHOICES.flatMap((choice) => [
      choice.previewPath,
      ...choice.floors.map((floor) => floor.previewPath),
    ]);

    expect(paths).toHaveLength(9);
    for (const previewPath of paths) {
      expect(previewPath).toMatch(/^\/studio-assets\/(backgrounds|floors)\/[a-z-]+\.webp$/);
      expect(previewPath).not.toMatch(/s3:\/\/|amazonaws|X-Amz-|studio-assets\/v1/);
      await expect(readFile(path.join(PUBLIC_ROOT, previewPath))).resolves.toBeInstanceOf(Buffer);
    }
  });
});
