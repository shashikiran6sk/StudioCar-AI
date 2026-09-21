"use client";

import { useEffect } from "react";

import { calculateAdaptivePollingDelay } from "./calculate-adaptive-polling-delay";
import { jobStatusIsTerminal } from "./job-status-is-terminal";
import { PROCESSING_STATUS_REQUEST_ERROR } from "./processing-polling.constants";
import { useProcessingStatusStore } from "./processing-status-store";
import { requestProcessingStatusBatches } from "./request-processing-status-batches";

export interface ProcessingStatusPollerProps {
  requestStatuses?: typeof requestProcessingStatusBatches;
}

export function ProcessingStatusPoller({
  requestStatuses = requestProcessingStatusBatches,
}: ProcessingStatusPollerProps) {
  const jobs = useProcessingStatusStore((state) => state.jobs);
  const update = useProcessingStatusStore((state) => state.update);
  const setError = useProcessingStatusStore((state) => state.setError);
  const activeKey = Object.values(jobs)
    .filter((job) => !job.status || !jobStatusIsTerminal(job.status))
    .map((job) => job.jobId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!activeKey) return;
    const trackedJobs = Object.values(useProcessingStatusStore.getState().jobs).filter(
      (job) => !job.status || !jobStatusIsTerminal(job.status),
    );
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const schedule = () => {
      if (disposed || document.visibilityState === "hidden") return;
      const delay = calculateAdaptivePollingDelay(
        trackedJobs.map((job) => job.startedAtMilliseconds),
        Date.now(),
      );
      if (delay !== null) timeoutId = setTimeout(poll, delay);
    };
    const poll = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      try {
        const response = await requestStatuses(
          trackedJobs.map((job) => job.jobId),
          controller.signal,
        );
        if (disposed) return;
        update(response.jobs);
        setError(null);
      } catch (error) {
        if (
          disposed ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        setError(
          error instanceof Error ? error.message : PROCESSING_STATUS_REQUEST_ERROR,
        );
      }
      schedule();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }
      void poll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState !== "hidden") void poll();
    return () => {
      disposed = true;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeKey, requestStatuses, setError, update]);

  return null;
}
