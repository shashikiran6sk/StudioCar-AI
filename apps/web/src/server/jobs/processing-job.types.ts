import type {
  CreateProcessingBatch,
  CreateProcessingBatchResponse,
} from "@studiocar/contracts";
import type { ReserveProcessingBatchCommand, ReserveProcessingBatchResult } from "../db/repositories/processing-job-repository";
import type {
  ProcessingOutboxDispatchRequest,
  ProcessingOutboxDispatchResult,
} from "@studiocar/processing";

export interface ProcessingJobRepositoryPort {
  reserveBatchOwned(
    command: ReserveProcessingBatchCommand,
  ): Promise<ReserveProcessingBatchResult>;
}

export interface ProcessingDispatchPort {
  dispatch(
    request?: ProcessingOutboxDispatchRequest,
  ): Promise<ProcessingOutboxDispatchResult>;
}

export type CreateProcessingJobsResult =
  | { ok: true; response: CreateProcessingBatchResponse }
  | {
      ok: false;
      reason:
        | "ASSETS_NOT_READY"
        | "IDEMPOTENCY_CONFLICT"
        | "VEHICLE_NOT_DRAFT"
        | "VEHICLE_NOT_FOUND";
    };

export interface ProcessingJobApplication {
  createBatch(
    userId: string,
    idempotencyKey: string,
    command: CreateProcessingBatch,
  ): Promise<CreateProcessingJobsResult>;
}
