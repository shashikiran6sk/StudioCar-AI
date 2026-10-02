import { readFile } from "node:fs/promises";
import path from "node:path";

import { STUDIO_BACKGROUND_ASSETS } from "../../../../../workers/image-processing/src/execution/studio-background.constants";
import type { StudioBackground } from "../../../../../workers/image-processing/src/execution/studio-background.types";
import type { FloorStyle } from "../../../../../packages/contracts/src/processing";

export const STUDIO_BACKGROUND_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../../workers/image-processing/assets/backgrounds",
);

export function loadStudioBackground(
  background: StudioBackground,
  floor: FloorStyle,
): Promise<Buffer> {
  return readFile(
    path.join(STUDIO_BACKGROUND_DIRECTORY, STUDIO_BACKGROUND_ASSETS[background][floor].file),
  );
}
