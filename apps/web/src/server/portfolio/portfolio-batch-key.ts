import type { PortfolioJobRecord } from "../db/repositories/portfolio-repository";

/** Jobs from before batch keys existed each stand as a batch of their own. */
export function portfolioBatchKey(
  job: Pick<PortfolioJobRecord, "batchIdempotencyKey" | "id">,
): string {
  return job.batchIdempotencyKey ?? job.id;
}
