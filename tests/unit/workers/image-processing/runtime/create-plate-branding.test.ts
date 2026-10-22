import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../../../../packages/observability/src/structured-logger";
import { LocalPlateBranding } from "../../../../../workers/image-processing/src/plate-branding/local-plate-branding";
import { createPlateBranding } from "../../../../../workers/image-processing/src/runtime/create-plate-branding";

const SETTINGS = { PLATE_BRANDING_ENABLED: true, PLATE_DETECTION_TIMEOUT_MS: 10000 };
const MODULE = "file:///worker/dist/handler.mjs";

describe("plate branding runtime budget", () => {
  afterEach(() => vi.restoreAllMocks());
  it("never creates a detector when the feature is disabled", () => {
    expect(createPlateBranding({ ...SETTINGS, PLATE_BRANDING_ENABLED: false }, MODULE)).toBeUndefined();
  });
  it("keeps background processing available on smaller existing Lambdas", () => {
    const log = vi.spyOn(logger, "log");
    expect(createPlateBranding({ ...SETTINGS, AWS_LAMBDA_FUNCTION_MEMORY_SIZE: 1024 }, MODULE)).toBeUndefined();
    expect(log).toHaveBeenCalledWith("warn", "plate_branding_result", { outcome: "skipped_memory_budget" });
  });
  it("enables lazy local inference at the verified Lambda budget and outside Lambda", () => {
    expect(createPlateBranding({ ...SETTINGS, AWS_LAMBDA_FUNCTION_MEMORY_SIZE: 2048 }, MODULE)).toBeInstanceOf(LocalPlateBranding);
    expect(createPlateBranding(SETTINGS, MODULE)).toBeInstanceOf(LocalPlateBranding);
  });
});
