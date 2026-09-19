import type { JobStatus } from "@studiocar/contracts";

import {
  PROCESSING_CANCELLED_LABEL,
  PROCESSING_COMPLETE_LABEL,
  PROCESSING_FAILED_LABEL,
  PROCESSING_PENDING_LABEL,
} from "./processing-polling.constants";

const stageLabels = {
  UPLOADING: "Uploading",
  QUEUED: "Queued",
  REMOVING_BACKGROUND: "Removing background",
  FINALIZING: "Finalizing",
  COMPLETE: PROCESSING_COMPLETE_LABEL,
} satisfies Record<JobStatus["stage"], string>;

export function processingStageLabel(status: JobStatus | undefined): string {
  if (!status) return PROCESSING_PENDING_LABEL;
  if (status.state === "FAILED") return PROCESSING_FAILED_LABEL;
  if (status.state === "CANCELLED") return PROCESSING_CANCELLED_LABEL;
  return stageLabels[status.stage];
}
