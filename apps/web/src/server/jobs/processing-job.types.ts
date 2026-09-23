import type {
  CreateProcessingBatch,
  CreateProcessingBatchResponse,
} from "@studiocar/contracts";
import type {
  ProcessingAllowance,
  ReserveProcessingBatchCommand,
  ReserveProcessingBatchResult,
} from "../db/repositories/processing-job-repository";
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

/**
 * Resolves the limits the tenant's current plan imposes. Kept behind a port so
 * the reservation does not depend on how plans are stored.
 */
export interface ProcessingAllowanceResolverPort {
  resolve(userId: string, now: Date): Promise<ProcessingAllowance>;
}

export type CreateProcessingJobsResult =
  | { ok: true; response: CreateProcessingBatchResponse }
  | {
      ok: false;
      reason:
        | "ASSETS_NOT_READY"
        | "IDEMPOTENCY_CONFLICT"
        | "VEHICLE_UNAVAILABLE"
        | "VEHICLE_NOT_FOUND";
    }
  | { ok: false; reason: "BATCH_LIMIT_EXCEEDED"; maxImagesPerBatch: number }
  | {
      ok: false;
      reason: "ALLOWANCE_EXHAUSTED";
      imageCapacity: number;
      imagesRemaining: number;
    };

export interface ProcessingJobApplication {
  createBatch(
    userId: string,
    idempotencyKey: string,
    command: CreateProcessingBatch,
  ): Promise<CreateProcessingJobsResult>;
}
