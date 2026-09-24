import { existsSync } from "node:fs";
import path from "node:path";

import { findRepositoryRoot } from "./find-repository-root";
import {
  APPLICATION_DIRECTORY,
  APPLICATION_ENVIRONMENT_FILES,
  REPOSITORY_ENVIRONMENT_FILE,
} from "./repository-environment.constants";

function misplacedSettingsMessage(files: readonly string[]): string {
  return (
    `Environment settings found in apps/web (${files.join(", ")}). ` +
    `StudioCar reads one settings file, ${REPOSITORY_ENVIRONMENT_FILE} at the ` +
    "repository root. Move these settings there, set APP_ENV, and delete the " +
    "apps/web copies. See docs/environments.md."
  );
}

/**
 * Loads the repository-root settings file into `process.env`.
 *
 * A variable that is already set always wins, so a deployment or CI run is
 * never masked by a local file, and a missing file is the deployed case.
 *
 * Settings files inside the application directory are refused rather than
 * merged: Next.js would load them on its own, and two files silently
 * overriding each other is exactly how environments get mixed.
 */
export function loadRepositoryEnvironment(startDirectory: string): void {
  const repositoryRoot = findRepositoryRoot(startDirectory);
  const misplaced = APPLICATION_ENVIRONMENT_FILES.filter((file) =>
    existsSync(path.join(repositoryRoot, APPLICATION_DIRECTORY, file)),
  );
  if (misplaced.length > 0) throw new Error(misplacedSettingsMessage(misplaced));

  const settingsFile = path.join(repositoryRoot, REPOSITORY_ENVIRONMENT_FILE);
  if (existsSync(settingsFile)) process.loadEnvFile(settingsFile);
}
