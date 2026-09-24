import {
  applyEnvironmentProfile,
  isLocalServiceUrl,
  type EnvironmentValues,
} from "@studiocar/config";

/**
 * The browser-facing origin of local object storage, when the environment's
 * storage is the local emulator. Deployed storage returns nothing: AWS S3 is
 * already an allowed source, and nothing else may become one.
 */
export function resolveLocalStorageOrigin(
  environment: EnvironmentValues,
): string | undefined {
  const endpoint = applyEnvironmentProfile(environment)["S3_ENDPOINT"];
  if (endpoint === undefined || !isLocalServiceUrl(endpoint)) return undefined;

  return new URL(endpoint).origin;
}
