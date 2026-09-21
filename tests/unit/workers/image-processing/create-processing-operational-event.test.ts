import { describe, expect, it } from "vitest";

import { WorkerMessageSchema } from "../../../../packages/contracts/src/worker";
import { createProcessingOperationalEvent } from "../../../../workers/image-processing/src/create-processing-operational-event";

const message = WorkerMessageSchema.parse({
  enqueuedAt: "2026-09-21T09:59:00.000Z",
  jobId: "7e38d07b-c3c3-4ce0-9a50-91055e9bf3de",
  type: "PROCESS_IMAGE",
  version: 1,
});

describe("createProcessingOperationalEvent", () => {
  it("emits correlated completion, latency, provider, and throughput metrics", () => {
    const event = createProcessingOperationalEvent({
      finishedAtMilliseconds: Date.parse("2026-09-21T10:00:02.000Z"),
      message,
      queueMessageId: "sqs-message-1",
      result: {
        kind: "COMPLETED",
        processedAssetId: "processed-asset-1",
        telemetry: {
          assetId: "asset-1",
          attemptNumber: 1,
          failureKind: null,
          provider: "REMOVEBG",
          providerLatencyMilliseconds: 850,
          providerRequestId: "provider-request-1",
          userId: "user-1",
          vehicleId: "vehicle-1",
        },
      },
      startedAtMilliseconds: Date.parse("2026-09-21T10:00:00.000Z"),
    });

    expect(event).toMatchObject({
      correlation: {
        assetId: "asset-1",
        jobId: message.jobId,
        providerRequestId: "provider-request-1",
        queueMessageId: "sqs-message-1",
        userId: "user-1",
        vehicleId: "vehicle-1",
      },
      dimensions: { Outcome: "COMPLETED", Provider: "REMOVEBG" },
      eventName: "image_processing_message",
      level: "INFO",
      service: "image-processing-worker",
    });
    expect(event.metrics).toEqual([
      { name: "ProcessingMessageCount", unit: "Count", value: 1 },
      {
        name: "ProcessingDurationMilliseconds",
        unit: "Milliseconds",
        value: 2_000,
      },
      {
        name: "ProcessingEndToEndLatencyMilliseconds",
        unit: "Milliseconds",
        value: 62_000,
      },
      {
        name: "ProviderLatencyMilliseconds",
        unit: "Milliseconds",
        value: 850,
      },
      { name: "ImagesProcessed", unit: "Count", value: 1 },
    ]);
  });

  it("counts provider rate limits as durable retries without logging error text", () => {
    const event = createProcessingOperationalEvent({
      finishedAtMilliseconds: Date.parse("2026-09-21T10:00:01.000Z"),
      message,
      queueMessageId: "sqs-message-2",
      result: {
        kind: "RETRY_SCHEDULED",
        nextAttemptAt: new Date("2026-09-21T10:01:00.000Z"),
        telemetry: {
          assetId: "asset-1",
          attemptNumber: 2,
          failureKind: "PROVIDER_429",
          provider: "REMOVEBG",
          providerLatencyMilliseconds: 100,
          providerRequestId: null,
          userId: "user-1",
          vehicleId: "vehicle-1",
        },
      },
      startedAtMilliseconds: Date.parse("2026-09-21T10:00:00.000Z"),
    });

    expect(event.level).toBe("WARN");
    expect(event.metrics).toEqual(
      expect.arrayContaining([
        { name: "ProcessingRetryCount", unit: "Count", value: 1 },
        { name: "ProviderRateLimitCount", unit: "Count", value: 1 },
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("errorMessage");
  });
});
