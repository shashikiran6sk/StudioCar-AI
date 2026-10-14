import type { ProcessingOptions } from "@studiocar/contracts";

/**
 * The provider that executes processing. Historical jobs may name providers
 * that no longer exist; those values stay in PostgreSQL as history and are
 * never executed again.
 */
export type ProcessingProviderKey = "LEONARDO";

/**
 * The output resolution a job is processed at, decided by the account's plan.
 * Provider adapters translate it into their own size parameter.
 */
export type ProcessingQualityTier = "STANDARD" | "HIGH";

export interface ClaimedProcessingJob {
  attemptNumber: number;
  checksumSha256: string | null;
  id: string;
  imageAssetId: string;
  mimeType: string;
  options: ProcessingOptions;
  originalObjectKey: string;
  sizeBytes: bigint;
  /**
   * The plan key of the owner's lifetime purchase entitlement, read in the claim
   * transaction, or null without one. Resolution is derived from it.
   */
  ownedPlanKey: string | null;
  userId: string;
  vehicleId: string;
}

/**
 * `AWAITING_PUBLICATION` is a job whose queue message arrived before the
 * dispatcher recorded it as queued. It is about to become claimable, so its
 * message must not be dropped.
 */
export type ClaimProcessingJobResult =
  | { kind: "CLAIMED"; job: ClaimedProcessingJob }
  | {
      kind:
        | "AWAITING_PUBLICATION"
        | "CLAIM_BUSY"
        | "NOT_FOUND"
        | "NOT_READY"
        | "TERMINAL";
    };

export interface ClaimProcessingJobInput {
  claimExpiresAt: Date;
  jobId: string;
  now: Date;
  /** The provider this attempt runs on, recorded on the attempt row. */
  provider: ProcessingProviderKey;
  workerId: string;
}

export interface ProcessingOutput {
  checksumSha256: string | null;
  height: number;
  mimeType: string;
  objectKey: string;
  outputFormat: "WEBP";
  previewObjectKey: string;
  sizeBytes: bigint;
  width: number;
}

export interface CompleteProcessingJobInput {
  attemptNumber: number;
  completedAt: Date;
  jobId: string;
  output: ProcessingOutput;
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
  usageBillingPeriodKey: string;
  usageIdempotencyKey: string;
  workerId: string;
}

export type CompleteProcessingJobResult =
  | { kind: "COMPLETED"; processedAssetId: string }
  | { kind: "ALREADY_COMPLETED"; processedAssetId: string }
  | { kind: "CLAIM_LOST" | "NOT_FOUND" };

export interface FailProcessingJobInput {
  attemptNumber: number;
  errorCode: string;
  errorMessage: string;
  failedAt: Date;
  jobId: string;
  nextAttemptAt: Date;
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
  retryable: boolean;
  workerId: string;
}

export type FailProcessingJobResult =
  | { kind: "RETRY_SCHEDULED"; nextAttemptAt: Date }
  | { kind: "FAILED" }
  | { kind: "CLAIM_LOST" | "NOT_FOUND" };

export interface ProcessingWorkerRepositoryPort {
  claimJob(input: ClaimProcessingJobInput): Promise<ClaimProcessingJobResult>;
  completeJob(
    input: CompleteProcessingJobInput,
  ): Promise<CompleteProcessingJobResult>;
  failJob(input: FailProcessingJobInput): Promise<FailProcessingJobResult>;
}

export type ProcessingFailureKind =
  | "AUTHORIZATION"
  | "CONTENT_BLOCKED"
  | "INTERNAL"
  | "INVALID_IMAGE"
  | "INVALID_REQUEST"
  | "NETWORK"
  | "PAYMENT_REQUIRED"
  | "NON_CAR_IMAGE"
  | "PROVIDER_429"
  | "PROVIDER_5XX"
  | "TIMEOUT"
  | "UNSUPPORTED_FORMAT"
  /**
   * The provider charged for a result that could not be used (an unreadable
   * response, or an output that fails validation). Retrying would pay again
   * for the same outcome, so it is terminal.
   */
  | "UNUSABLE_PROVIDER_RESULT";

/** Where in the pipeline a failure happened, for operational metrics. */
export type ProcessingFailureStage =
  | "SOURCE"
  | "PROVIDER"
  | "COMPOSITION"
  | "STORAGE";

export interface ProcessingExecutionFailure {
  errorMessage: string;
  kind: ProcessingFailureKind;
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
  /**
   * How long the provider asked callers to wait, when it said. The durable
   * retry never runs sooner than this, within the configured maximum.
   */
  retryAfterMilliseconds: number | null;
  stage: ProcessingFailureStage;
}

/** A provider's failure, before the executor records its pipeline stage. */
export type ProviderFailure = Omit<ProcessingExecutionFailure, "stage">;

export type ProcessingExecutionResult =
  | {
      ok: true;
      output: ProcessingOutput;
      providerLatencyMilliseconds: number | null;
      providerRequestId: string | null;
    }
  | { ok: false; failure: ProcessingExecutionFailure };

export interface ProcessingJobExecutorPort {
  /** The provider every job this executor runs is processed by. */
  readonly providerKey: ProcessingProviderKey;
  execute(job: ClaimedProcessingJob): Promise<ProcessingExecutionResult>;
}

export interface ProcessingWorkerOptions {
  claimTtlMilliseconds: number;
  retryBaseMilliseconds: number;
  retryMaximumMilliseconds: number;
}

export interface ProcessingWorkerTelemetry {
  assetId: string;
  attemptNumber: number;
  failureKind: ProcessingFailureKind | null;
  failureStage: ProcessingFailureStage | null;
  provider: ProcessingProviderKey;
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
  userId: string;
  vehicleId: string;
}

type ProcessWorkerMessageOutcome =
  | { kind: "COMPLETED"; processedAssetId: string }
  | { kind: "IGNORED"; reason: "NOT_FOUND" | "NOT_READY" | "TERMINAL" }
  | { kind: "RETRY_SCHEDULED"; nextAttemptAt: Date }
  | { kind: "FAILED" }
  | { kind: "RETRY_DELIVERY" };

export type ProcessWorkerMessageResult = ProcessWorkerMessageOutcome & {
  telemetry?: ProcessingWorkerTelemetry;
};

export interface ProcessingFailureClassification {
  errorCode: string;
  retryable: boolean;
}
