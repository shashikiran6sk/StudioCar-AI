import type { ClaimedProcessingJob } from "@studiocar/processing";

export interface ProcessingObjectKeys {
  output: string;
  preview: string;
  /**
   * The provider's transparent vehicle and shadow, staged before composition
   * so a retry never pays the provider again. Named apart from the
   * `provider-result.webp` that earlier providers staged without a shadow, so
   * a retry across the migration never reuses one of those.
   */
  providerCutout: string;
}

export function buildProcessingObjectKeys(
  job: Pick<ClaimedProcessingJob, "id" | "imageAssetId" | "userId" | "vehicleId">,
): ProcessingObjectKeys {
  const prefix = `users/${job.userId}/vehicles/${job.vehicleId}/assets/${job.imageAssetId}/jobs/${job.id}`;
  return {
    output: `${prefix}/processed.webp`,
    preview: `${prefix}/preview.webp`,
    providerCutout: `${prefix}/provider-cutout.webp`,
  };
}
