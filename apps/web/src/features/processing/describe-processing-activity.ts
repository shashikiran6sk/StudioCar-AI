import {
  PROCESSING_ACTIVE_SUFFIX,
  PROCESSING_FAILED_SUFFIX_PLURAL,
  PROCESSING_FAILED_SUFFIX_SINGULAR,
  PROCESSING_IMAGE_PLURAL,
  PROCESSING_IMAGE_SINGULAR,
  PROCESSING_READY_SUFFIX,
} from "./processing-polling.constants";

export interface ProcessingActivityCounts {
  activeCount: number;
  completedCount: number;
  failedCount: number;
}

function images(count: number): string {
  return `${String(count)} ${count === 1 ? PROCESSING_IMAGE_SINGULAR : PROCESSING_IMAGE_PLURAL}`;
}

/**
 * Says what the tracked images are doing, in order of what matters most.
 *
 * Work still running comes first, then anything that failed. Only when
 * neither remains does it report the images that are ready — rather than
 * announcing "0 images need attention" about a batch that simply finished.
 */
export function describeProcessingActivity(
  counts: ProcessingActivityCounts,
): string {
  if (counts.activeCount > 0) {
    return `${images(counts.activeCount)} ${PROCESSING_ACTIVE_SUFFIX}`;
  }
  if (counts.failedCount > 0) {
    return `${images(counts.failedCount)} ${
      counts.failedCount === 1
        ? PROCESSING_FAILED_SUFFIX_SINGULAR
        : PROCESSING_FAILED_SUFFIX_PLURAL
    }`;
  }
  return `${images(counts.completedCount)} ${PROCESSING_READY_SUFFIX}`;
}
