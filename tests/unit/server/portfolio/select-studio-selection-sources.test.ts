import {
  ImageAssetStatus,
  ProcessingJobStatus,
  VehicleStatus,
} from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { groupStudioVersions } from "../../../../apps/web/src/server/portfolio/group-studio-versions";
import { selectAttentionJobs } from "../../../../apps/web/src/server/portfolio/select-attention-jobs";
import { selectStudioSelectionSources } from "../../../../apps/web/src/server/portfolio/select-studio-selection-sources";
import { portfolioJob, portfolioRecord } from "./portfolio-record-test-data";

const DAY_ONE = new Date("2026-09-19T10:00:00.000Z");

describe("selectStudioSelectionSources", () => {
  it("skips a stored original that is gone and did not fail", () => {
    const deleted = portfolioJob({
      assetStatus: ImageAssetStatus.DELETED,
      batch: "first",
      createdAt: DAY_ONE,
      displayOrder: 0,
    });
    const failed = portfolioJob({
      batch: "first",
      createdAt: DAY_ONE,
      displayOrder: 1,
      errorCode: "PROVIDER_INVALID_REQUEST",
      status: ProcessingJobStatus.FAILED,
    });
    const record = portfolioRecord([deleted, failed], VehicleStatus.PARTIALLY_FAILED);

    const selection = selectStudioSelectionSources(
      "REPROCESS_FAILED",
      record.processingJobs,
      groupStudioVersions(record.processingJobs),
      null,
      selectAttentionJobs(record),
    );

    expect(selection?.sources.map((source) => source.job.id)).toEqual([failed.id]);
    expect(selection?.sources[0]?.failureReason).toBe("BACKGROUND_REMOVAL_FAILED");
  });

  it("leaves out a version's photo whose original is no longer stored", () => {
    const kept = portfolioJob({ batch: "first", createdAt: DAY_ONE, displayOrder: 0 });
    const gone = portfolioJob({
      assetStatus: ImageAssetStatus.DELETED,
      batch: "first",
      createdAt: DAY_ONE,
      displayOrder: 1,
    });
    const record = portfolioRecord([kept, gone]);

    const selection = selectStudioSelectionSources(
      "CREATE_VARIANT",
      record.processingJobs,
      groupStudioVersions(record.processingJobs),
      null,
      null,
    );

    expect(selection?.sources.map((source) => source.job.id)).toEqual([kept.id]);
  });

  it("has nothing to offer Replace without a batch needing attention", () => {
    expect(
      selectStudioSelectionSources("REPLACE_FAILED", [], [], null, null),
    ).toBeNull();
  });
});
