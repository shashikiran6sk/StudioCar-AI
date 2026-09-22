import type { PlanKey } from "@studiocar/contracts";

export interface PlanUsageSummary {
  planKey: PlanKey;
  planName: string;
  imagesUsed: number;
  imageCapacity: number;
  maxImagesPerBatch: number;
  storageUsedBytes: number;
  storageCapacityBytes: number | null;
}
