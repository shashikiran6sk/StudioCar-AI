import { describe, expect, it } from "vitest";

import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { createClaimedJob } from "../test-support/create-claimed-job";

describe("buildProcessingObjectKeys", () => {
  it("creates deterministic tenant-prefixed WebP keys for one job", () => {
    const job = createClaimedJob();
    const prefix = `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}`;

    expect(buildProcessingObjectKeys(job)).toEqual({
      output: `${prefix}/processed.webp`,
      preview: `${prefix}/preview.webp`,
      providerCutout: `${prefix}/provider-cutout.webp`,
    });
  });

  it("never reuses the shadowless artifact earlier providers staged", () => {
    expect(buildProcessingObjectKeys(createClaimedJob()).providerCutout).not.toMatch(
      /provider-result\.webp$/,
    );
  });
});
