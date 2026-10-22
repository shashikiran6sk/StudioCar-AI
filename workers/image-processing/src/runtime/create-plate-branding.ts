import { existsSync } from "node:fs";

import { MINIMUM_PLATE_BRANDING_MEMORY_MEGABYTES, type ImageWorkerEnvironment } from "@studiocar/config";
import { logger } from "@studiocar/observability";

import { ForkedPlateDetector } from "../plate-branding/forked-plate-detector";
import { LocalPlateBranding } from "../plate-branding/local-plate-branding";
import { PLATE_BRANDING_EVENT, PLATE_BRANDING_OUTCOMES } from "../plate-branding/plate-branding.constants";
import type { PlateBrandingPort } from "../plate-branding/plate-branding.types";
import { resolvePlateBrandingPaths } from "./resolve-plate-branding-paths";

type Configuration = Pick<ImageWorkerEnvironment,
  "AWS_LAMBDA_FUNCTION_MEMORY_SIZE" | "PLATE_BRANDING_ENABLED" | "PLATE_DETECTION_TIMEOUT_MS">;

/** Lower-memory existing Lambdas retain background processing even if enabled. */
export function createPlateBranding(environment: Configuration, moduleUrl: string): PlateBrandingPort | undefined {
  if (!environment.PLATE_BRANDING_ENABLED) return undefined;
  const memory = environment.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
  if (memory !== undefined && memory < MINIMUM_PLATE_BRANDING_MEMORY_MEGABYTES) {
    logger.log("warn", PLATE_BRANDING_EVENT, { outcome: PLATE_BRANDING_OUTCOMES.MEMORY });
    return undefined;
  }
  const paths = resolvePlateBrandingPaths(moduleUrl, existsSync);
  return new LocalPlateBranding(new ForkedPlateDetector(paths.detector, environment.PLATE_DETECTION_TIMEOUT_MS), paths.assets);
}
