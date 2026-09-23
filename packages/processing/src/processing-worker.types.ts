import type { ProcessingOptions } from "@studiocar/contracts";

export type ProcessingProviderKey = "REMOVEBG" | "FAL" | "BIREFNET";

export interface ClaimedProcessingJob {
  attemptNumber: number;
  checksumSha256: string | null;
  id: string;
  imageAssetId: string;
  mimeType: string;
  options: ProcessingOptions;
  originalObjectKey: string;
  provider: ProcessingProviderKey;
  sizeBytes: bigint;
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
  | { kind: "AWAITING_PUBLICATION" | "NOT_FOUND" | "NOT_READY" | "TERMINAL" };

export interface ClaimProcessingJobInput {
  claimExpiresAt: Date;
  jobId: string;
  now: Date;
  workerId: string;
}

export interface ProcessingOutput {
  checksumSha256: string | null;
  height: number;
  mimeType: string;
  objectKey: string;
  outputFormat: "JPEG" | "PNG" | "WEBP";
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
  | "INTERNAL"
  | "INVALID_IMAGE"
  | "INVALID_REQUEST"
  | "NETWORK"
  | "PROVIDER_429"
  | "PROVIDER_5XX"
  | "TIMEOUT"
  | "UNSUPPORTED_FORMAT";

export interface ProcessingExecutionFailure {
  errorMessage: string;
  kind: ProcessingFailureKind;
  providerLatencyMilliseconds: number | null;
  providerRequestId: string | null;
}

export type ProcessingExecutionResult =
  | {
      ok: true;
      output: ProcessingOutput;
      providerLatencyMilliseconds: number | null;
      providerRequestId: string | null;
    }
  | { ok: false; failure: ProcessingExecutionFailure };

export interface ProcessingJobExecutorPort {
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
