import type {
  ProcessingJobReservation,
  ProcessingOptions,
} from "@studiocar/contracts";

import { requestProcessingBatch } from "./request-processing-batch";

export interface CompleteProcessingBatchDependencies {
  navigateToInventory: () => void;
  refresh: () => void;
  register: (jobs: ProcessingJobReservation[]) => void;
  request?: typeof requestProcessingBatch;
}

export async function completeProcessingBatch(
  vehicleId: string,
  assetIds: string[],
  options: ProcessingOptions,
  idempotencyKey: string,
  dependencies: CompleteProcessingBatchDependencies,
): Promise<void> {
  const request = dependencies.request ?? requestProcessingBatch;
  const result = await request(
    { vehicleId, assetIds, options },
    idempotencyKey,
  );
  dependencies.register(result.jobs);
  dependencies.navigateToInventory();
  dependencies.refresh();
}
