import {
  ProcessingJobStatus,
  VehicleStatus,
} from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { selectAttentionJobs } from "../../../../apps/web/src/server/portfolio/select-attention-jobs";
import { portfolioJob, portfolioRecord } from "./portfolio-record-test-data";

const DAY_ONE = new Date("2026-09-19T10:00:00.000Z");
const DAY_TWO = new Date("2026-09-20T10:00:00.000Z");

describe("selectAttentionJobs", () => {
  it("names the newest batch's failed and cancelled jobs", () => {
    const failed = portfolioJob({
      batch: "new",
      createdAt: DAY_TWO,
      displayOrder: 1,
      status: ProcessingJobStatus.FAILED,
    });
    const cancelled = portfolioJob({
      batch: "new",
      createdAt: DAY_TWO,
      displayOrder: 2,
      status: ProcessingJobStatus.CANCELLED,
    });
    const record = portfolioRecord(
      [
        portfolioJob({ batch: "old", createdAt: DAY_ONE, status: ProcessingJobStatus.FAILED }),
        portfolioJob({ batch: "new", createdAt: DAY_TWO, displayOrder: 0 }),
        failed,
        cancelled,
      ],
      VehicleStatus.PARTIALLY_FAILED,
    );

    const attention = selectAttentionJobs(record);

    expect(attention?.jobs).toHaveLength(3);
    expect(attention?.failedJobs).toEqual([failed, cancelled]);
  });

  it("ignores failures when the vehicle does not need attention", () => {
    const record = portfolioRecord(
      [portfolioJob({ batch: "new", createdAt: DAY_TWO, status: ProcessingJobStatus.FAILED })],
      VehicleStatus.PROCESSING,
    );

    expect(selectAttentionJobs(record)).toBeNull();
  });

  it("does not treat an automatic retry as needing attention", () => {
    const record = portfolioRecord(
      [portfolioJob({ batch: "new", createdAt: DAY_TWO, status: ProcessingJobStatus.RETRYING })],
      VehicleStatus.PARTIALLY_FAILED,
    );

    expect(selectAttentionJobs(record)).toBeNull();
  });
});
