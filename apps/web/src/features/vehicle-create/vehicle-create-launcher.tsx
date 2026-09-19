"use client";

import type { ProcessingOptions } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";
import { useRouter } from "next/navigation";

import { INVENTORY_PATH } from "../../app/app-routes";
import { completeProcessingBatch } from "./complete-processing-batch";
import { useProcessingStatusStore } from "../processing/processing-status-store";
import { VehicleCreateDialog } from "./vehicle-create-dialog";
import { VEHICLE_CREATE_TRIGGER_LABEL } from "./vehicle-create.constants";

export function VehicleCreateLauncher() {
  const router = useRouter();

  async function processBatch(
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ): Promise<void> {
    await completeProcessingBatch(
      vehicleId,
      assetIds,
      options,
      idempotencyKey,
      {
        navigateToInventory: () => router.push(INVENTORY_PATH),
        refresh: () => router.refresh(),
        register: (jobs) => useProcessingStatusStore.getState().register(jobs),
      },
    );
  }

  return (
    <VehicleCreateDialog
      onProcess={processBatch}
      trigger={<Button variant="primary">{VEHICLE_CREATE_TRIGGER_LABEL}</Button>}
    />
  );
}
