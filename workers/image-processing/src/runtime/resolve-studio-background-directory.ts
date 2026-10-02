import path from "node:path";
import { fileURLToPath } from "node:url";

import { STUDIO_BACKGROUND_DIRECTORY } from "../execution/studio-background.constants";

/**
 * The packaged background directory: beside the handler bundle in a Lambda
 * archive (`assets/backgrounds`), or at the package root when a local bundle
 * runs from `dist/`. `moduleUrl` is the running bundle's `import.meta.url`.
 */
export function resolveStudioBackgroundDirectory(
  moduleUrl: string,
  exists: (directory: string) => boolean,
): string {
  const moduleDirectory = path.dirname(fileURLToPath(moduleUrl));
  const beside = path.join(moduleDirectory, STUDIO_BACKGROUND_DIRECTORY);
  return exists(beside)
    ? beside
    : path.join(moduleDirectory, "..", STUDIO_BACKGROUND_DIRECTORY);
}
