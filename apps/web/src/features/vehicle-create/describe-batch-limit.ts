import {
  PHOTO_UPLOAD_LIMIT_IMAGE_PLURAL,
  PHOTO_UPLOAD_LIMIT_IMAGE_SINGULAR,
  PHOTO_UPLOAD_LIMIT_PER_BATCH,
  PHOTO_UPLOAD_LIMIT_PLAN_SUFFIX,
  PHOTO_UPLOAD_LIMIT_PREFIX,
  PHOTO_UPLOAD_LIMIT_SEPARATOR,
  PHOTO_UPLOAD_LIMIT_UPGRADE_PREFIX,
  PHOTO_UPLOAD_LIMIT_UPGRADE_SUFFIX,
} from "./vehicle-create.constants";

export interface BatchLimit {
  /** The largest batch any plan on offer allows, or null when none is. */
  largestAvailableBatch: number | null;
  maxImagesPerBatch: number;
  planName: string;
}

/**
 * Tells somebody how many photos this batch can hold, from their actual plan.
 *
 * It offers an upgrade only when a plan on offer genuinely allows more, so an
 * account already on the largest batch is never told to upgrade to what it
 * has. Built rather than stored, so it cannot drift from what the server
 * enforces.
 */
export function describeBatchLimit(limit: BatchLimit): string {
  const unit =
    limit.maxImagesPerBatch === 1
      ? PHOTO_UPLOAD_LIMIT_IMAGE_SINGULAR
      : PHOTO_UPLOAD_LIMIT_IMAGE_PLURAL;
  const current = [
    `${limit.planName} ${PHOTO_UPLOAD_LIMIT_PLAN_SUFFIX}${PHOTO_UPLOAD_LIMIT_SEPARATOR}${PHOTO_UPLOAD_LIMIT_PREFIX}`,
    String(limit.maxImagesPerBatch),
    unit,
    PHOTO_UPLOAD_LIMIT_PER_BATCH,
  ].join(" ");

  const upgrade =
    limit.largestAvailableBatch !== null &&
    limit.largestAvailableBatch > limit.maxImagesPerBatch
      ? `${PHOTO_UPLOAD_LIMIT_UPGRADE_PREFIX} ${String(limit.largestAvailableBatch)}${PHOTO_UPLOAD_LIMIT_UPGRADE_SUFFIX}`
      : null;

  return upgrade === null ? current : `${current} ${upgrade}`;
}
