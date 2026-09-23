import type { PortfolioJobRecord } from "../db/repositories/portfolio-repository";
import { portfolioBatchKey } from "./portfolio-batch-key";
import { sortByDisplayOrder } from "./sort-by-display-order";

/**
 * The jobs of the newest batch, in the order they were submitted. Expects
 * jobs newest first, as the portfolio repository returns them.
 */
export function selectLatestBatchJobs(
  jobs: PortfolioJobRecord[],
): PortfolioJobRecord[] {
  const newest = jobs[0];
  if (!newest) return [];
  const key = portfolioBatchKey(newest);
  return sortByDisplayOrder(jobs.filter((job) => portfolioBatchKey(job) === key));
}
