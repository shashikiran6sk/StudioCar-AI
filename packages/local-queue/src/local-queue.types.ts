import type { SqsBatchResponse } from "@studiocar/contracts";

export interface LocalQueueMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
}

/**
 * The same shape a Lambda handler receives, so the local consumer drives the
 * deployed entry point rather than a parallel implementation of it.
 */
export type LocalQueueHandler = (event: {
  Records: { messageId: string; body: string }[];
}) => Promise<SqsBatchResponse>;

export interface LocalQueueConsumerOptions {
  queueUrl: string;
  waitTimeSeconds?: number;
  maxMessages?: number;
  idleDelayMs?: number;
  errorDelayMs?: number;
  signal?: AbortSignal;
  onError?: (error: unknown) => void;
}
