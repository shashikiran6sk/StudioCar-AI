import { describe, expect, it, vi } from "vitest";

import type { OperationalEvent } from "../../../../packages/observability/src/operational-telemetry.types";

import type { WorkerMessage } from "../../../../packages/contracts/src/worker";
import type { ProcessWorkerMessageResult } from "../../../../packages/processing/src/processing-worker.types";
import { handleProcessingQueueEvent } from "../../../../workers/image-processing/src/handle-processing-queue-event";
import type { ProcessingMessageProcessorPort } from "../../../../workers/image-processing/src/processing-message-handler.types";

const JOB_ID = "7e38d07b-c3c3-4ce0-9a50-91055e9bf3de";

class StubProcessor implements ProcessingMessageProcessorPort {
  public readonly messages: WorkerMessage[] = [];

  public constructor(private readonly result: ProcessWorkerMessageResult) {}

  public process(message: WorkerMessage): Promise<ProcessWorkerMessageResult> {
    this.messages.push(message);
    return Promise.resolve(this.result);
  }
}

class FailingProcessor implements ProcessingMessageProcessorPort {
  public constructor(private readonly error: unknown) {}

  public process(): Promise<ProcessWorkerMessageResult> {
    return Promise.reject(this.error);
  }
}

function createRecord(messageId: string, body: string) {
  return { messageId, body };
}

describe("handleProcessingQueueEvent", () => {
  it("acknowledges completed and durably scheduled records", async () => {
    const processor = new StubProcessor({ kind: "FAILED" });
    const emit = vi.fn(() => true);
    const response = await handleProcessingQueueEvent(
      {
        Records: [
          createRecord(
            "message-1",
            JSON.stringify({
              version: 1,
              type: "PROCESS_IMAGE",
              jobId: JOB_ID,
              enqueuedAt: "2026-09-20T00:00:00.000Z",
            }),
          ),
        ],
      },
      processor,
      { emit },
    );

    expect(response).toEqual({ batchItemFailures: [] });
    expect(processor.messages).toHaveLength(1);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("returns only malformed and retry-delivery records as partial failures", async () => {
    const processor = new StubProcessor({ kind: "RETRY_DELIVERY" });
    const emit = vi.fn(() => true);
    const response = await handleProcessingQueueEvent(
      {
        Records: [
          createRecord("malformed", "not-json"),
          createRecord(
            "retry",
            JSON.stringify({
              version: 1,
              type: "PROCESS_IMAGE",
              jobId: JOB_ID,
              enqueuedAt: "2026-09-20T00:00:00.000Z",
            }),
          ),
        ],
      },
      processor,
      { emit },
    );

    expect(response).toEqual({
      batchItemFailures: [
        { itemIdentifier: "malformed" },
        { itemIdentifier: "retry" },
      ],
    });
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("retries and reports the class of an error the processor throws", async () => {
    const databaseUnreachable = Object.assign(
      new Error("Can't reach database server at db.example.test"),
      { code: "P1001", name: "PrismaClientKnownRequestError" },
    );
    const events: OperationalEvent[] = [];
    const response = await handleProcessingQueueEvent(
      {
        Records: [
          createRecord(
            "unreachable",
            JSON.stringify({
              version: 1,
              type: "PROCESS_IMAGE",
              jobId: JOB_ID,
              enqueuedAt: "2026-09-20T00:00:00.000Z",
            }),
          ),
        ],
      },
      new FailingProcessor(databaseUnreachable),
      {
        emit: (event) => {
          events.push(event);
          return true;
        },
      },
    );

    expect(response).toEqual({
      batchItemFailures: [{ itemIdentifier: "unreachable" }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      correlation: { jobId: JOB_ID, queueMessageId: "unreachable" },
      dimensions: { Outcome: "RECORD_RETRY" },
      error: { code: "P1001", name: "PrismaClientKnownRequestError" },
    });
    expect(JSON.stringify(events)).not.toContain("db.example.test");
  });
});
