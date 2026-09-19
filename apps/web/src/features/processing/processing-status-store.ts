import { create } from "zustand";

import type {
  ActiveProcessingJob,
  ProcessingStatusStoreState,
} from "./active-processing-job.types";

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
          if (existing) jobs[status.jobId] = { ...existing, status };
        }
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
