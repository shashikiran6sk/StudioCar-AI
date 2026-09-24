import { existsSync } from "node:fs";
import path from "node:path";

import { REPOSITORY_ROOT_MARKER } from "./repository-environment.constants";

const REPOSITORY_ROOT_NOT_FOUND_ERROR =
  "Could not find the repository root from the current directory.";

/** Walks up from `startDirectory` to the directory holding the workspace file. */
export function findRepositoryRoot(startDirectory: string): string {
  let directory = path.resolve(startDirectory);

  for (;;) {
    if (existsSync(path.join(directory, REPOSITORY_ROOT_MARKER))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error(REPOSITORY_ROOT_NOT_FOUND_ERROR);
    directory = parent;
  }
}
