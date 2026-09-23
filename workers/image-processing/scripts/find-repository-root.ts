import { existsSync } from "node:fs";
import path from "node:path";

const WORKSPACE_MARKER = "pnpm-workspace.yaml";

/** The workspace root, found from wherever a script was bundled to. */
export function findRepositoryRoot(start: string = process.cwd()): string {
  let directory = start;
  while (!existsSync(path.join(directory, WORKSPACE_MARKER))) {
    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new Error("The StudioCar workspace root was not found.");
    }
    directory = parent;
  }
  return directory;
}
