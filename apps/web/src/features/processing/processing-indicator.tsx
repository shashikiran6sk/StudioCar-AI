"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { describeProcessingActivity } from "./describe-processing-activity";

import { jobStatusIsTerminal } from "./job-status-is-terminal";
import {
  PROCESSING_DISMISS_LABEL,
  PROCESSING_INDICATOR_LABEL,
  PROCESSING_PANEL_HEADING,
} from "./processing-polling.constants";
import { PROCESSING_FAILURE_MESSAGES } from "./processing-failure-messages.constants";
import { processingStageLabel } from "./processing-stage-label";
import { ProcessingStatusPoller } from "./processing-status-poller";
import { useProcessingStatusStore } from "./processing-status-store";
import { useRefreshWhenJobsSettle } from "./use-refresh-when-jobs-settle";

export function ProcessingIndicator() {
  const [open, setOpen] = useState(false);
  const jobs = useProcessingStatusStore((state) => state.jobs);
  const error = useProcessingStatusStore((state) => state.error);
  const dismiss = useProcessingStatusStore((state) => state.dismiss);
  const entries = Object.values(jobs);
  const activeCount = entries.filter(
    (job) => !job.status || !jobStatusIsTerminal(job.status),
  ).length;
  const failedCount = entries.filter(
    (job) => job.status?.state === "FAILED",
  ).length;
  const completedCount = entries.filter(
    (job) => job.status?.state === "COMPLETED",
  ).length;
  const router = useRouter();
  useRefreshWhenJobsSettle(activeCount, router.refresh);

  return (
    <div className="processing-indicator">
      <ProcessingStatusPoller />
      {entries.length > 0 ? (
        <>
          <button
            aria-expanded={open}
            aria-label={PROCESSING_INDICATOR_LABEL}
            className={
              failedCount > 0 && activeCount === 0
                ? "processing-indicator__trigger processing-indicator__trigger--error"
                : "processing-indicator__trigger"
            }
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span aria-hidden="true" className="processing-indicator__dot" />
            {describeProcessingActivity({
              activeCount,
              completedCount,
              failedCount,
            })}
          </button>
          {open ? (
            <section
              aria-label={PROCESSING_PANEL_HEADING}
              aria-live="polite"
              className="processing-panel"
            >
              <h2>{PROCESSING_PANEL_HEADING}</h2>
              {error ? (
                <p className="processing-panel__error">{error}</p>
              ) : null}
              <ul>
                {entries.map((job, index) => {
                  const terminal = job.status
                    ? jobStatusIsTerminal(job.status)
                    : false;
                  return (
                    <li key={job.jobId}>
                      <span>
                        <strong>
                          {job.status?.vehicleName ??
                            `Image ${String(index + 1)}`}
                        </strong>
                        <small>{processingStageLabel(job.status)}</small>
                        {job.status?.state === "FAILED" ? (
                          <small className="processing-panel__error">
                            {PROCESSING_FAILURE_MESSAGES.PROCESSING_FAILED}
                          </small>
                        ) : null}
                      </span>
                      {terminal ? (
                        <button
                          aria-label={`${PROCESSING_DISMISS_LABEL} ${job.status?.vehicleName ?? "image status"}`}
                          onClick={() => dismiss(job.jobId)}
                          type="button"
                        >
                          {PROCESSING_DISMISS_LABEL}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
