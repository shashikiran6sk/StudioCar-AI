import type {
  CreateProcessingBatch,
  ProcessingJobReservation,
} from "@studiocar/contracts";

import { requestProcessingBatch } from "./request-processing-batch";

export interface CompleteProcessingBatchDependencies {
  /** Where the person continues once the batch is accepted. */
  navigate: () => void;
  refresh: () => void;
  register: (jobs: ProcessingJobReservation[]) => void;
  request?: typeof requestProcessingBatch;
}

export async function completeProcessingBatch(
  command: CreateProcessingBatch,
  idempotencyKey: string,
  dependencies: CompleteProcessingBatchDependencies,
): Promise<void> {
  const request = dependencies.request ?? requestProcessingBatch;
  const result = await request(command, idempotencyKey);
  dependencies.register(result.jobs);
  dependencies.navigate();
  dependencies.refresh();
}
