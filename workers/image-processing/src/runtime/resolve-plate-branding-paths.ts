import path from "node:path";
import { fileURLToPath } from "node:url";

import { PLATE_BRANDING_DIRECTORY, PLATE_DETECTOR_ENTRY } from "../plate-branding/plate-branding.constants";

export function resolvePlateBrandingPaths(moduleUrl: string, exists: (directory: string) => boolean): { assets: string; detector: string } {
  const directory = path.dirname(fileURLToPath(moduleUrl));
  const beside = path.join(directory, PLATE_BRANDING_DIRECTORY);
  return {
    assets: exists(beside) ? beside : path.join(directory, "..", PLATE_BRANDING_DIRECTORY),
    detector: path.join(directory, PLATE_DETECTOR_ENTRY),
  };
}
