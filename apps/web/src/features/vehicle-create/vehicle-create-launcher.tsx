"use client";

import type { ProcessingOptions } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";

import { requestProcessingBatch } from "./request-processing-batch";
import { useProcessingStatusStore } from "../processing/processing-status-store";
import { VehicleCreateDialog } from "./vehicle-create-dialog";
import { VEHICLE_CREATE_TRIGGER_LABEL } from "./vehicle-create.constants";

export function VehicleCreateLauncher() {
  async function processBatch(
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ): Promise<void> {
    const result = await requestProcessingBatch(
      { vehicleId, assetIds, options },
      idempotencyKey,
    );
    useProcessingStatusStore.getState().register(result.jobs);
  }

  return (
    <VehicleCreateDialog
      onProcess={processBatch}
      trigger={<Button variant="primary">{VEHICLE_CREATE_TRIGGER_LABEL}</Button>}
    />
  );
}
