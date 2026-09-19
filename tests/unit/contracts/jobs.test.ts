import { describe, expect, it } from "vitest";

import {
  CreateProcessingBatchSchema,
  JobStatusQuerySchema,
  JobStatusSchema,
} from "../../../packages/contracts/src/jobs";

const jobId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const assetId = "ce5f7431-f293-42ce-aa54-99e60d646448";
const updatedAt = "2026-09-18T10:30:00Z";

describe("job contracts", () => {
  it("ties completed jobs to the complete stage and an output asset", () => {
    expect(
      JobStatusSchema.safeParse({
        jobId,
        assetId,
        updatedAt,
        state: "COMPLETED",
        stage: "FINALIZING",
      }).success,
    ).toBe(false);

    expect(
      JobStatusSchema.safeParse({
        jobId,
        assetId,
        updatedAt,
        state: "COMPLETED",
        stage: "COMPLETE",
        processedAssetId: "f4c14c97-e2c8-4d99-8fe0-b32af81d8905",
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate IDs in the batched status query", () => {
    expect(JobStatusQuerySchema.safeParse({ ids: [jobId, jobId] }).success).toBe(
      false,
    );
  });

  it("validates a normalized processing batch and rejects duplicate assets", () => {
    const vehicleId = "0e879f46-1193-4d77-b785-057fe026d998";

    expect(
      CreateProcessingBatchSchema.parse({
        vehicleId,
        assetIds: [assetId],
        options: {},
      }),
    ).toMatchObject({
      options: {
        background: "PREMIUM_WHITE",
        enhancement: true,
        platePrivacy: true,
      },
    });
    expect(
      CreateProcessingBatchSchema.safeParse({
        vehicleId,
        assetIds: [assetId, assetId],
        options: {},
      }).success,
    ).toBe(false);
  });
});
