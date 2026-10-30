import type { MarketingBatchLimits } from "./marketing-batch-limits.types";
import { MARKETING_UPLOAD_LIMIT_COPY } from "./marketing.constants";

function countImages(count: number): string {
  return `${String(count)} ${
    count === 1
      ? MARKETING_UPLOAD_LIMIT_COPY.imageSingular
      : MARKETING_UPLOAD_LIMIT_COPY.imagePlural
  }`;
}

/** `Free: 5 images · Paid: 20 images`, from the plans actually on offer. */
export function describeUploadLimits(limits: MarketingBatchLimits): string {
  const parts = [
    limits.free === null
      ? null
      : `${MARKETING_UPLOAD_LIMIT_COPY.freeLabel}: ${countImages(limits.free)}`,
    limits.paid === null
      ? null
      : `${MARKETING_UPLOAD_LIMIT_COPY.paidLabel}: ${countImages(limits.paid)}`,
  ].filter((part) => part !== null);
  return parts.length === 0
    ? MARKETING_UPLOAD_LIMIT_COPY.fallback
    : parts.join(MARKETING_UPLOAD_LIMIT_COPY.separator);
}
