import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";

import { resolveStudioBackgroundDirectory } from "../../../../../workers/image-processing/src/runtime/resolve-studio-background-directory";

const BUNDLE = pathToFileURL("/var/task/handler.mjs").href;

it("uses the directory beside a Lambda bundle", () => {
  expect(resolveStudioBackgroundDirectory(BUNDLE, () => true)).toBe(
    "/var/task/assets/backgrounds",
  );
});

it("falls back to the package root for a bundle built into dist/", () => {
  const local = pathToFileURL("/repo/workers/image-processing/dist/local.mjs").href;
  expect(resolveStudioBackgroundDirectory(local, () => false)).toBe(
    "/repo/workers/image-processing/assets/backgrounds",
  );
});
