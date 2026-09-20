import type { EmailWorkerMessage } from "@studiocar/contracts";

export interface EmailMessageSnapshot {
  id: string;
  recipient: string;
  vehicleId: string;
  vehicleName: string;
}

export interface EmailOutboxMessage extends EmailMessageSnapshot {
  createdAt: Date;
  publishAttemptCount: number;
}

export interface ClaimEmailOutboxInput {
  claimExpiresAt: Date;
  claimToken: string;
  limit: number;
  now: Date;
}

export interface MarkEmailOutboxPublishedInput {
  claimToken: string;
  messageId: string;
  publishedAt: Date;
  queueMessageId: string;
}

export interface ReleaseEmailOutboxInput {
  claimToken: string;
  errorCode: string;
  messageId: string;
  nextAttemptAt: Date;
}

export interface EmailOutboxRepositoryPort {
  claimPendingOutbox(
    input: ClaimEmailOutboxInput,
  ): Promise<EmailOutboxMessage[]>;
  markOutboxPublished(input: MarkEmailOutboxPublishedInput): Promise<boolean>;
  releaseOutboxClaim(input: ReleaseEmailOutboxInput): Promise<boolean>;
}

export interface EmailQueuePublishResult {
  messageId: string;
}

export interface EmailQueuePort {
  publish(message: EmailWorkerMessage): Promise<EmailQueuePublishResult>;
}

export interface EmailOutboxDispatcherOptions {
  applicationBaseUrl: string;
  batchSize: number;
  claimTtlMilliseconds: number;
  retryBaseMilliseconds: number;
  retryMaximumMilliseconds: number;
}

export interface EmailOutboxDispatchResult {
  claimed: number;
  failed: number;
  published: number;
}

export interface ClaimEmailDeliveryInput {
  claimExpiresAt: Date;
  claimToken: string;
  messageId: string;
  now: Date;
}

export type ClaimEmailDeliveryResult =
  | { kind: "CLAIMED"; message: EmailMessageSnapshot }
  | { kind: "NOT_READY" }
  | { kind: "TERMINAL" };

export interface CompleteEmailDeliveryInput {
  claimToken: string;
  deliveredAt: Date;
  messageId: string;
  providerMessageId: string;
}

export interface FailEmailDeliveryInput {
  claimToken: string;
  errorCode: string;
  failedAt: Date;
  messageId: string;
}

export interface ReleaseEmailDeliveryInput {
  claimToken: string;
  errorCode: string;
  messageId: string;
}

export interface EmailDeliveryRepositoryPort {
  claimDelivery(
    input: ClaimEmailDeliveryInput,
  ): Promise<ClaimEmailDeliveryResult>;
  completeDelivery(input: CompleteEmailDeliveryInput): Promise<boolean>;
  failDelivery(input: FailEmailDeliveryInput): Promise<boolean>;
  releaseDelivery(input: ReleaseEmailDeliveryInput): Promise<boolean>;
}

export type MailDeliveryResult =
  | { kind: "DELIVERED"; providerMessageId: string }
  | { errorCode: string; kind: "FAILED"; retryable: boolean };

export interface MailerPort {
  send(message: EmailWorkerMessage): Promise<MailDeliveryResult>;
}

export interface EmailDeliveryProcessorOptions {
  applicationBaseUrl: string;
  claimTtlMilliseconds: number;
}

export type EmailDeliveryProcessResult = "ACKNOWLEDGED" | "RETRY";

export interface EmailDeliveryProcessorPort {
  process(message: EmailWorkerMessage): Promise<EmailDeliveryProcessResult>;
}
