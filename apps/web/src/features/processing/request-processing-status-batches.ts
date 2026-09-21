import {
  MAX_JOB_STATUS_QUERY_IDS,
  type JobStatusResponse,
} from "@studiocar/contracts";

import { requestProcessingStatuses } from "./request-processing-statuses";

export async function requestProcessingStatusBatches(
  jobIds: string[],
  signal?: AbortSignal,
  requestBatch: typeof requestProcessingStatuses = requestProcessingStatuses,
): Promise<JobStatusResponse> {
  const jobs: JobStatusResponse["jobs"] = [];
  for (let offset = 0; offset < jobIds.length; offset += MAX_JOB_STATUS_QUERY_IDS) {
    const response = await requestBatch(
      jobIds.slice(offset, offset + MAX_JOB_STATUS_QUERY_IDS),
      signal,
    );
    jobs.push(...response.jobs);
  }
  return { jobs };
}
