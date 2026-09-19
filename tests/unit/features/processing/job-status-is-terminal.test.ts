import { describe, expect, it } from "vitest";

import { JobStatusSchema } from "../../../../packages/contracts/src/jobs";
import { jobStatusIsTerminal } from "../../../../apps/web/src/features/processing/job-status-is-terminal";

const base = {
  assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
  jobId: "8c879f46-1193-4d77-b785-057fe026d111",
  updatedAt: "2026-09-19T10:00:00.000Z",
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  vehicleName: "2024 Audi Q5",
};

describe("jobStatusIsTerminal", () => {
  it("stops only completed, failed, and cancelled jobs", () => {
    expect(
      jobStatusIsTerminal(
        JobStatusSchema.parse({ ...base, state: "QUEUED", stage: "QUEUED" }),
      ),
    ).toBe(false);
    expect(
      jobStatusIsTerminal(
        JobStatusSchema.parse({
          ...base,
          state: "FAILED",
          stage: "REMOVING_BACKGROUND",
          errorCode: "PROVIDER_5XX",
          retryable: true,
        }),
      ),
    ).toBe(true);
  });
});
