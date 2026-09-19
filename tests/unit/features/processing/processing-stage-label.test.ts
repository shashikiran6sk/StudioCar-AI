import { describe, expect, it } from "vitest";

import { JobStatusSchema } from "../../../../packages/contracts/src/jobs";
import { processingStageLabel } from "../../../../apps/web/src/features/processing/processing-stage-label";

const base = {
  assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
  jobId: "8c879f46-1193-4d77-b785-057fe026d111",
  updatedAt: "2026-09-19T10:00:00.000Z",
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  vehicleName: "2024 Audi Q5",
};

describe("processingStageLabel", () => {
  it("uses truthful stage and terminal labels", () => {
    expect(processingStageLabel(undefined)).toBe("Preparing image");
    expect(
      processingStageLabel(
        JobStatusSchema.parse({
          ...base,
          state: "PROCESSING",
          stage: "REMOVING_BACKGROUND",
        }),
      ),
    ).toBe("Removing background");
    expect(
      processingStageLabel(
        JobStatusSchema.parse({
          ...base,
          state: "FAILED",
          stage: "FINALIZING",
          errorCode: "FINALIZATION_FAILED",
          retryable: true,
        }),
      ),
    ).toBe("Needs attention");
  });
});
