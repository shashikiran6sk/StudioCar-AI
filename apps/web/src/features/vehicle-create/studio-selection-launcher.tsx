"use client";

import type {
  ProcessingOptions,
  StudioSelectionContext,
} from "@studiocar/contracts";
import { useRouter } from "next/navigation";

import { completeProcessingBatch } from "./complete-processing-batch";
import { describeBatchLimit } from "./describe-batch-limit";
import { VehicleCreateDialog } from "./vehicle-create-dialog";
import { useProcessingStatusStore } from "../processing/processing-status-store";
import { usePlanLimits } from "../shell/plan-limits-context";

export interface StudioSelectionLauncherProps {
  /** Where Cancel returns to: the page the dialog was opened from. */
  cancelHref: string;
  context: StudioSelectionContext;
  /** Where processing is followed once the batch is accepted. */
  successHref: string;
}

/**
 * The Selection Dialog opened on an existing vehicle. It submits through the
 * same processing command as a new upload, and replaces the URL on both exits
 * so the browser's back button never reopens a dialog that already finished.
 */
export function StudioSelectionLauncher({
  cancelHref,
  context,
  successHref,
}: StudioSelectionLauncherProps) {
  const router = useRouter();
  const limits = usePlanLimits();

  async function processBatch(
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ): Promise<void> {
    await completeProcessingBatch(vehicleId, assetIds, options, idempotencyKey, {
      navigate: () => router.replace(successHref),
      refresh: () => router.refresh(),
      register: (jobs) => useProcessingStatusStore.getState().register(jobs),
    });
  }

  return (
    <VehicleCreateDialog
      batchLimitLabel={describeBatchLimit(limits)}
      context={context}
      maxImagesPerBatch={limits.maxImagesPerBatch}
      onCancel={() => router.replace(cancelHref)}
      onProcess={processBatch}
    />
  );
}
