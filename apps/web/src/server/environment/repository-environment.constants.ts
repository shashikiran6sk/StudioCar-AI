/** The one settings file every local process reads, at the repository root. */
export const REPOSITORY_ENVIRONMENT_FILE = ".env.local";

/** Present only at the repository root, which is how the root is found. */
export const REPOSITORY_ROOT_MARKER = "pnpm-workspace.yaml";

/** The Next.js application, relative to the repository root. */
export const APPLICATION_DIRECTORY = "apps/web";

/**
 * Files Next.js would load from the application directory by itself. Settings
 * there would silently mix with, and override, the repository settings file.
 */
export const APPLICATION_ENVIRONMENT_FILES: readonly string[] = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
];
