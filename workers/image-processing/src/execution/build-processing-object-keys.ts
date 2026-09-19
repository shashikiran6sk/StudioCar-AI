import type { ClaimedProcessingJob } from "@studiocar/processing";

export interface ProcessingObjectKeys {
  output: string;
  preview: string;
  providerResult: string;
}

const outputExtensions = {
  JPEG: "jpg",
  PNG: "png",
  WEBP: "webp",
} satisfies Record<ClaimedProcessingJob["options"]["outputFormat"], string>;

export function buildProcessingObjectKeys(
  job: ClaimedProcessingJob,
): ProcessingObjectKeys {
  const prefix = `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}`;
  return {
    output: `${prefix}/processed.${outputExtensions[job.options.outputFormat]}`,
    preview: `${prefix}/preview.webp`,
    providerResult: `${prefix}/provider-result.webp`,
  };
}
