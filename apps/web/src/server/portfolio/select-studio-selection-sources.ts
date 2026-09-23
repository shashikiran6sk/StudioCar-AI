import {
  ProcessingOptionsSchema,
  type ExistingVehicleSelectionMode,
  type ProcessingFailureReason,
  type ProcessingOptions,
} from "@studiocar/contracts";
import {
  jobRequiresUserAttention,
  toProcessingFailureReason,
} from "@studiocar/processing";

import type { PortfolioJobRecord } from "../db/repositories/portfolio-repository";
import type { AttentionBatch } from "./select-attention-jobs";
import type { StudioVersionGroup } from "./group-studio-versions";
import { imageRequiresReplacement } from "./image-requires-replacement";
import { selectLatestBatchJobs } from "./select-latest-batch-jobs";

export interface StudioSelectionSource {
  failureReason: ProcessingFailureReason | null;
  job: PortfolioJobRecord;
  replaceRequired: boolean;
  selected: boolean;
}

export interface StudioSelectionSources {
  options: ProcessingOptions;
  sources: StudioSelectionSource[];
}

function fromBatch(jobs: PortfolioJobRecord[]): StudioSelectionSources | null {
  const first = jobs[0];
  if (!first) return null;
  const sources = jobs.flatMap((job): StudioSelectionSource[] => {
    const failed = jobRequiresUserAttention(job.status);
    const replaceRequired = imageRequiresReplacement(job);
    // An original that is gone and did not fail has nothing left to offer.
    if (!failed && replaceRequired) return [];
    return [
      {
        failureReason: failed
          ? toProcessingFailureReason(job.status, job.errorCode)
          : null,
        job,
        replaceRequired,
        // Retrying failed images must not re-process the ones that succeeded
        // unless the person selects them: only failed, usable photos start
        // selected.
        selected: failed && !replaceRequired,
      },
    ];
  });
  return { options: ProcessingOptionsSchema.parse(first.options), sources };
}

/**
 * What the Selection Dialog starts with for each way it can be opened on an
 * existing vehicle.
 *
 * A new studio version starts from an existing version's photos and
 * treatment, all selected. Re-process and Replace start from the newest
 * batch — the one that failed — with its failed photos marked.
 */
export function selectStudioSelectionSources(
  mode: ExistingVehicleSelectionMode,
  jobs: PortfolioJobRecord[],
  versions: StudioVersionGroup[],
  versionId: string | null,
  attention: AttentionBatch | null,
): StudioSelectionSources | null {
  if (mode !== "CREATE_VARIANT") {
    return attention ? fromBatch(attention.jobs) : null;
  }

  const version =
    versions.find((candidate) => candidate.id === versionId) ?? versions[0];
  if (!version) return fromBatch(selectLatestBatchJobs(jobs));
  return {
    options: version.options,
    sources: version.jobs
      .filter((job) => !imageRequiresReplacement(job))
      .map((job) => ({
        failureReason: null,
        job,
        replaceRequired: false,
        selected: true,
      })),
  };
}
