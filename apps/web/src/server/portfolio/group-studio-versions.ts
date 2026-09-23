import {
  ProcessingOptionsSchema,
  type ProcessingOptions,
} from "@studiocar/contracts";
import { ProcessingJobStatus } from "@studiocar/database-runtime";
import { createProcessingOptionsKey } from "@studiocar/processing";

import type { PortfolioJobRecord } from "../db/repositories/portfolio-repository";
import { sortByDisplayOrder } from "./sort-by-display-order";

export interface StudioVersionGroup {
  completedAt: Date;
  id: string;
  jobs: PortfolioJobRecord[];
  options: ProcessingOptions;
}

/**
 * Groups completed images into studio versions: one version per treatment,
 * holding the newest completed image of each original.
 *
 * A re-process of only the failed photos, made with the same treatment,
 * therefore completes the version it was retrying instead of hiding the
 * photos that had already succeeded. A different background or floor starts
 * a version of its own and leaves the others untouched. Expects jobs newest
 * first; returns versions most recently completed first.
 */
export function groupStudioVersions(
  jobs: PortfolioJobRecord[],
): StudioVersionGroup[] {
  const versions = new Map<string, StudioVersionGroup>();
  const seenAssets = new Map<string, Set<string>>();

  for (const job of jobs) {
    if (
      job.status !== ProcessingJobStatus.COMPLETED ||
      !job.processedAsset ||
      !job.completedAt
    ) {
      continue;
    }
    const options = ProcessingOptionsSchema.parse(job.options);
    const id = createProcessingOptionsKey(options);
    const assets = seenAssets.get(id) ?? new Set<string>();
    if (assets.has(job.imageAsset.id)) continue;
    assets.add(job.imageAsset.id);
    seenAssets.set(id, assets);

    const version = versions.get(id);
    if (!version) {
      versions.set(id, { completedAt: job.completedAt, id, jobs: [job], options });
      continue;
    }
    version.jobs.push(job);
    if (job.completedAt > version.completedAt) {
      version.completedAt = job.completedAt;
    }
  }

  return [...versions.values()]
    .map((version) => ({ ...version, jobs: sortByDisplayOrder(version.jobs) }))
    .sort(
      (left, right) => right.completedAt.getTime() - left.completedAt.getTime(),
    );
}
