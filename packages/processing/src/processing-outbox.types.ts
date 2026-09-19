import type { WorkerMessage } from "@studiocar/contracts";

export interface ProcessingOutboxMessage {
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
  markOutboxPublished(
    input: MarkProcessingOutboxPublishedInput,
  ): Promise<boolean>;
  releaseOutboxClaim(input: ReleaseProcessingOutboxInput): Promise<boolean>;
}

export interface ProcessingQueuePublishResult {
  messageId: string;
}

export interface ProcessingQueuePort {
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
