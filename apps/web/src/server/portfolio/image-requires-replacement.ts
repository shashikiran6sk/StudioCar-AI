import { ImageAssetStatus } from "@studiocar/database-runtime";

import type { PortfolioJobRecord } from "../db/repositories/portfolio-repository";

/**
 * The worker marks an original `INVALID` when it cannot be decoded or is an
 * unsupported format. No re-process can succeed; only a new photo can.
 */
export function imageRequiresReplacement(
  job: Pick<PortfolioJobRecord, "imageAsset">,
): boolean {
  return job.imageAsset.status !== ImageAssetStatus.UPLOADED;
}
