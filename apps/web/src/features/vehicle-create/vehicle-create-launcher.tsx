"use client";

import type { ProcessingOptions } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";

import { requestProcessingBatch } from "./request-processing-batch";
import { VehicleCreateDialog } from "./vehicle-create-dialog";
import { VEHICLE_CREATE_TRIGGER_LABEL } from "./vehicle-create.constants";

export function VehicleCreateLauncher() {
  async function processBatch(
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ): Promise<void> {
    await requestProcessingBatch(
      { vehicleId, assetIds, options },
      idempotencyKey,
    );
  }

  return (
    <VehicleCreateDialog
      onProcess={processBatch}
      trigger={<Button variant="primary">{VEHICLE_CREATE_TRIGGER_LABEL}</Button>}
    />
  );
}
