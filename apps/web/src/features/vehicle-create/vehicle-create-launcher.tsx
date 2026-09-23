"use client";

import type { CreateProcessingBatch } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";
import { useRouter } from "next/navigation";

import { INVENTORY_PATH } from "../../app/app-routes";
import { completeProcessingBatch } from "./complete-processing-batch";
import { describeBatchLimit } from "./describe-batch-limit";
import { useProcessingStatusStore } from "../processing/processing-status-store";
import { VehicleCreateDialog } from "./vehicle-create-dialog";
import { VEHICLE_CREATE_TRIGGER_LABEL } from "./vehicle-create.constants";
import { usePlanLimits } from "../shell/plan-limits-context";

export function VehicleCreateLauncher() {
  const router = useRouter();
  const limits = usePlanLimits();

  async function processBatch(
    command: CreateProcessingBatch,
    idempotencyKey: string,
  ): Promise<void> {
    await completeProcessingBatch(command, idempotencyKey, {
      navigate: () => router.push(INVENTORY_PATH),
      refresh: () => router.refresh(),
      register: (jobs) => useProcessingStatusStore.getState().register(jobs),
    });
  }

  return (
    <VehicleCreateDialog
      batchLimitLabel={describeBatchLimit(limits)}
      maxImagesPerBatch={limits.maxImagesPerBatch}
      onProcess={processBatch}
      trigger={<Button variant="primary">{VEHICLE_CREATE_TRIGGER_LABEL}</Button>}
    />
  );
}
