import { ProcessingJobStatus } from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { groupStudioVersions } from "../../../../apps/web/src/server/portfolio/group-studio-versions";
import {
  DARK_OPTIONS,
  portfolioJob,
  portfolioRecord,
} from "./portfolio-record-test-data";

const DAY_ONE = new Date("2026-09-19T10:00:00.000Z");
const DAY_TWO = new Date("2026-09-20T10:00:00.000Z");

describe("groupStudioVersions", () => {
  it("makes one version per treatment, newest first", () => {
    const record = portfolioRecord([
      portfolioJob({ batch: "white", createdAt: DAY_ONE }),
      portfolioJob({ batch: "dark", createdAt: DAY_TWO, options: DARK_OPTIONS }),
    ]);

    const versions = groupStudioVersions(record.processingJobs);

    expect(versions.map((version) => version.options.background)).toEqual([
      "DARK_STUDIO",
      "PREMIUM_WHITE",
    ]);
  });

  it("completes a version with a same-treatment retry of its failed photo", () => {
    const record = portfolioRecord([
      portfolioJob({ assetId: "front", batch: "first", createdAt: DAY_ONE, displayOrder: 0 }),
      portfolioJob({
        assetId: "side",
        batch: "first",
        createdAt: DAY_ONE,
        displayOrder: 1,
        status: ProcessingJobStatus.FAILED,
      }),
      portfolioJob({ assetId: "side", batch: "retry", createdAt: DAY_TWO, displayOrder: 0 }),
    ]);

    const [version] = groupStudioVersions(record.processingJobs);

    expect(version?.jobs.map((job) => job.imageAsset.id).sort()).toEqual([
      "front",
      "side",
    ]);
    expect(version?.completedAt).toEqual(DAY_TWO);
  });

  it("keeps only the newest completed image of each original", () => {
    const newer = portfolioJob({ assetId: "front", batch: "second", createdAt: DAY_TWO });
    const record = portfolioRecord([
      portfolioJob({ assetId: "front", batch: "first", createdAt: DAY_ONE }),
      newer,
    ]);

    const [version] = groupStudioVersions(record.processingJobs);

    expect(version?.jobs).toEqual([newer]);
  });

  it("has no versions until something completes", () => {
    const record = portfolioRecord([
      portfolioJob({ batch: "first", createdAt: DAY_ONE, status: ProcessingJobStatus.FAILED }),
      portfolioJob({ batch: "first", createdAt: DAY_ONE, status: ProcessingJobStatus.RETRYING }),
    ]);

    expect(groupStudioVersions(record.processingJobs)).toEqual([]);
  });
});
