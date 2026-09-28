import { create } from "zustand";

import type {
  ActiveProcessingJob,
  ProcessingStatusStoreState,
} from "./active-processing-job.types";
import type { JobStatus } from "@studiocar/contracts";

function statusEqual(left: JobStatus, right: JobStatus): boolean {
  if (
    left.jobId !== right.jobId ||
    left.assetId !== right.assetId ||
    left.vehicleId !== right.vehicleId ||
    left.vehicleName !== right.vehicleName ||
    left.updatedAt !== right.updatedAt ||
    left.state !== right.state ||
    left.stage !== right.stage
  ) return false;
  switch (left.state) {
    case "PROCESSING":
      return left.providerProgressPercent ===
        (right.state === "PROCESSING" ? right.providerProgressPercent : undefined);
    case "RETRYING":
      return left.nextAttemptAt ===
        (right.state === "RETRYING" ? right.nextAttemptAt : undefined);
    case "COMPLETED":
      return right.state === "COMPLETED" && left.processedAssetId === right.processedAssetId;
    case "FAILED":
      return right.state === "FAILED" && left.errorCode === right.errorCode && left.retryable === right.retryable;
    case "CREATED":
    case "QUEUED":
    case "CANCELLED":
      return true;
  }
}

export const useProcessingStatusStore = create<ProcessingStatusStoreState>(
  (set) => ({
    error: null,
    jobs: {},
    register: (reservations, startedAtMilliseconds = Date.now()) => {
      set((state) => {
        const jobs: Record<string, ActiveProcessingJob> = { ...state.jobs };
        for (const reservation of reservations) {
          jobs[reservation.jobId] = {
            assetId: reservation.assetId,
            jobId: reservation.jobId,
            startedAtMilliseconds,
          };
        }
        return { jobs };
      });
    },
    update: (statuses) => {
      set((state) => {
        const jobs: Record<string, ActiveProcessingJob> = { ...state.jobs };
        for (const status of statuses) {
          const existing = jobs[status.jobId];
          if (existing && (!existing.status || !statusEqual(existing.status, status))) {
            jobs[status.jobId] = { ...existing, status };
          }
        }
        if (Object.keys(jobs).every((jobId) => jobs[jobId] === state.jobs[jobId])) return state;
        return { jobs };
      });
    },
    dismiss: (jobId) => {
      set((state) => {
        const jobs: Record<string, ActiveProcessingJob> = { ...state.jobs };
        delete jobs[jobId];
        return { jobs };
      });
    },
    setError: (error) => set({ error }),
  }),
);
