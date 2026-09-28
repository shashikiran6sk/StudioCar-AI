import type { WorkerMessage } from "@studiocar/contracts";

export interface ProcessingOutboxMessage {
  job?: { requestId: string | null; batchIdempotencyKey: string | null };
  attemptCount: number;
  createdAt: Date;
  id: string;
  jobId: string;
}

export interface ClaimProcessingOutboxInput {
  claimExpiresAt: Date;
  claimToken: string;
  jobIds?: string[];
  limit: number;
  now: Date;
}

export interface MarkProcessingOutboxPublishedInput {
  claimToken: string;
  messageId: string;
  publishedAt: Date;
  queueMessageId: string;
}

export interface ReleaseProcessingOutboxInput {
  claimToken: string;
  errorCode: string;
  messageId: string;
  nextAttemptAt: Date;
}

export interface ProcessingOutboxRepositoryPort {
  claimPendingOutbox(
    input: ClaimProcessingOutboxInput,
  ): Promise<ProcessingOutboxMessage[]>;
  markOutboxPublishedBatch?(inputs: MarkProcessingOutboxPublishedInput[]): Promise<string[]>;
  markOutboxPublished(
    input: MarkProcessingOutboxPublishedInput,
  ): Promise<boolean>;
  releaseOutboxClaim(input: ReleaseProcessingOutboxInput): Promise<boolean>;
}

export interface ProcessingQueuePublishResult {
  messageId: string;
}

export type ProcessingQueueBatchResult =
  | { jobId: string; outcome: "PUBLISHED"; messageId: string }
  | { jobId: string; outcome: "FAILED" };

export interface ProcessingQueuePort {
  publishBatch?(messages: WorkerMessage[], timeoutMilliseconds: number): Promise<ProcessingQueueBatchResult[]>;
  publish(message: WorkerMessage): Promise<ProcessingQueuePublishResult>;
}

export interface ProcessingOutboxDispatcherOptions {
  batchSize: number;
  claimTtlMilliseconds: number;
  retryBaseMilliseconds: number;
  retryMaximumMilliseconds: number;
}

export interface ProcessingOutboxDispatchRequest {
  jobIds?: string[];
}

export interface ProcessingOutboxDispatchResult {
  claimed: number;
  failed: number;
  published: number;
}
