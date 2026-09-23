import { ProcessingJobStatus } from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { groupStudioVersions } from "../../../../apps/web/src/server/portfolio/group-studio-versions";
import { createProcessingOptionsKey } from "../../../../packages/processing/src/create-processing-options-key";
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

  it("keeps same-treatment batches with different labels as separate versions", () => {
    const record = portfolioRecord([
      portfolioJob({ assetId: "front", batch: "t04-s01", createdAt: DAY_ONE, label: "T04-S01" }),
      portfolioJob({ assetId: "front", batch: "t04-s03", createdAt: DAY_TWO, label: "T04-S03" }),
      portfolioJob({ assetId: "front", batch: "plain", createdAt: DAY_ONE }),
    ]);

    const versions = groupStudioVersions(record.processingJobs);

    expect(versions.map((version) => version.label)).toEqual([
      "T04-S03",
      "T04-S01",
      null,
    ]);
    expect(versions.every((version) => version.jobs.length === 1)).toBe(true);
    // An unlabelled version keeps the identity it had before labels existed.
    const unlabelled = versions.at(-1);
    expect(unlabelled?.id).toBe(
      unlabelled ? createProcessingOptionsKey(unlabelled.options) : undefined,
    );
  });
});
