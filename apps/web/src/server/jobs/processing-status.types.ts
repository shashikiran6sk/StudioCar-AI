import type {
  JobStatusQuery,
  JobStatusResponse,
} from "@studiocar/contracts";
import type { FindProcessingJobStatusesResult } from "../db/repositories/processing-job-status-repository";

export interface ProcessingJobStatusRepositoryPort {
  findOwned(
    userId: string,
    jobIds: string[],
  ): Promise<FindProcessingJobStatusesResult>;
}

export type GetProcessingStatusesResult =
  | { ok: true; response: JobStatusResponse }
  | { ok: false; reason: "NOT_FOUND" };

export interface ProcessingStatusApplication {
  getStatuses(
    userId: string,
    query: JobStatusQuery,
  ): Promise<GetProcessingStatusesResult>;
}
