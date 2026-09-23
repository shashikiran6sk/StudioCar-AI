import { describe, expect, it } from "vitest";

import { selectLatestBatchJobs } from "../../../../apps/web/src/server/portfolio/select-latest-batch-jobs";
import { portfolioJob, portfolioRecord } from "./portfolio-record-test-data";

const DAY_ONE = new Date("2026-09-19T10:00:00.000Z");
const DAY_TWO = new Date("2026-09-20T10:00:00.000Z");

describe("selectLatestBatchJobs", () => {
  it("returns the newest batch in submission order", () => {
    const second = portfolioJob({ batch: "new", createdAt: DAY_TWO, displayOrder: 1 });
    const first = portfolioJob({ batch: "new", createdAt: DAY_TWO, displayOrder: 0 });
    const record = portfolioRecord([
      portfolioJob({ batch: "old", createdAt: DAY_ONE }),
      second,
      first,
    ]);

    expect(selectLatestBatchJobs(record.processingJobs)).toEqual([first, second]);
  });

  it("separates an unchanged re-process from the batch it retried", () => {
    const retry = portfolioJob({ batch: "retry", createdAt: DAY_TWO });
    const record = portfolioRecord([
      portfolioJob({ batch: "original", createdAt: DAY_ONE }),
      retry,
    ]);

    expect(selectLatestBatchJobs(record.processingJobs)).toEqual([retry]);
  });

  it("returns nothing for a vehicle without jobs", () => {
    expect(selectLatestBatchJobs([])).toEqual([]);
  });
});
