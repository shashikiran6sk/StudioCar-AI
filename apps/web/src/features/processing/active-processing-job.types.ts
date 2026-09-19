import type { JobStatus, ProcessingJobReservation } from "@studiocar/contracts";

export interface ActiveProcessingJob {
  assetId: string;
  jobId: string;
  startedAtMilliseconds: number;
  status?: JobStatus;
}

export interface ProcessingStatusStoreState {
  error: string | null;
  jobs: Readonly<Record<string, ActiveProcessingJob>>;
  register(
    reservations: ProcessingJobReservation[],
    startedAtMilliseconds?: number,
  ): void;
  update(statuses: JobStatus[]): void;
  dismiss(jobId: string): void;
  setError(error: string | null): void;
}
