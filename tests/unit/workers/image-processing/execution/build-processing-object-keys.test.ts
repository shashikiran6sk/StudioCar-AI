import { describe, expect, it } from "vitest";

import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { createClaimedJob } from "../test-support/create-claimed-job";

describe("buildProcessingObjectKeys", () => {
  it("creates immutable tenant-prefixed keys with the requested extension", () => {
    const job = createClaimedJob();

    expect(buildProcessingObjectKeys(job)).toEqual({
      output: `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}/processed.jpg`,
      preview: `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}/preview.webp`,
      providerResult: `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}/provider-result.webp`,
    });
  });
});
