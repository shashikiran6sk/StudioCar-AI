import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../../../../packages/observability/src/structured-logger";
import { preparePlateOverlay } from "../../../../../workers/image-processing/src/plate-branding/prepare-plate-overlay";
import { createPlatePhoto } from "../test-support/create-plate-photo";

describe("optional plate preparation", () => {
  afterEach(() => vi.restoreAllMocks());
  it("returns no overlay when disabled or when none is detected", async () => {
    await expect(preparePlateOverlay(undefined, createPlatePhoto())).resolves.toBeNull();
    await expect(preparePlateOverlay({ prepare: () => Promise.resolve(null) }, createPlatePhoto())).resolves.toBeNull();
  });
  it("isolates detector failures and logs no external error data", async () => {
    const log = vi.spyOn(logger, "log");
    await expect(preparePlateOverlay({ prepare: () => Promise.reject(new Error("private-payload")) }, createPlatePhoto())).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith("warn", "plate_branding_result", expect.objectContaining({ outcome: "skipped_error" }));
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-payload");
  });
});
