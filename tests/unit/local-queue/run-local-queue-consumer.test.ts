import type { SQSClient } from "@aws-sdk/client-sqs";
import { describe, expect, it, vi } from "vitest";

import { runLocalQueueConsumer } from "../../../packages/local-queue/src/run-local-queue-consumer";
import type { LocalQueueHandler } from "../../../packages/local-queue/src/local-queue.types";

const queueUrl = "http://localhost:9324/000000000000/studiocar-images";

function message(id: string) {
  return { MessageId: id, ReceiptHandle: `receipt-${id}`, Body: "{}" };
}

/**
 * Drives one receive cycle and then aborts, so each test observes exactly the
 * commands that cycle issued.
 */
interface QueueMessageFixture {
  MessageId?: string;
  ReceiptHandle?: string;
  Body?: string;
}

function clientReturning(
  responses: { Messages?: QueueMessageFixture[] }[],
  controller: AbortController,
) {
  let call = 0;
  const send = vi.fn(async (command: { constructor: { name: string } }) => {
    if (command.constructor.name === "ReceiveMessageCommand") {
      const response = responses[call] ?? {};
      call += 1;
      if (call >= responses.length) controller.abort();
      return response;
    }
    return {};
  });
  return { client: { send } as unknown as SQSClient, send };
}

function commandNames(send: ReturnType<typeof vi.fn>): string[] {
  return send.mock.calls.map(
    ([command]) => (command as { constructor: { name: string } }).constructor.name,
  );
}

describe("runLocalQueueConsumer", () => {
  it("drives the handler with the event shape Lambda delivers", async () => {
    const controller = new AbortController();
    const { client } = clientReturning(
      [{ Messages: [message("m1"), message("m2")] }],
      controller,
    );
    const handler = vi.fn<LocalQueueHandler>(async () => ({
      batchItemFailures: [],
    }));

    await runLocalQueueConsumer(client, handler, {
      queueUrl,
      signal: controller.signal,
      waitTimeSeconds: 0,
      idleDelayMs: 0,
    });

    expect(handler).toHaveBeenCalledWith({
      Records: [
        { messageId: "m1", body: "{}" },
        { messageId: "m2", body: "{}" },
      ],
    });
  });

  it("deletes only the messages the handler acknowledged", async () => {
    const controller = new AbortController();
    const { client, send } = clientReturning(
      [{ Messages: [message("m1"), message("m2")] }],
      controller,
    );
    const handler = vi.fn<LocalQueueHandler>(async () => ({
      batchItemFailures: [{ itemIdentifier: "m2" }],
    }));

    await runLocalQueueConsumer(client, handler, {
      queueUrl,
      signal: controller.signal,
      waitTimeSeconds: 0,
      idleDelayMs: 0,
    });

    expect(commandNames(send)).toContain("DeleteMessageBatchCommand");
    const deletion = send.mock.calls.find(
      ([command]) =>
        (command as { constructor: { name: string } }).constructor.name ===
        "DeleteMessageBatchCommand",
    );
    const input = (deletion?.[0] as { input: { Entries: { Id: string }[] } })
      .input;
    expect(input.Entries.map((entry) => entry.Id)).toEqual(["m1"]);
  });

  it("issues no deletion when the whole batch is retried", async () => {
    const controller = new AbortController();
    const { client, send } = clientReturning(
      [{ Messages: [message("m1")] }],
      controller,
    );
    const handler = vi.fn<LocalQueueHandler>(async () => ({
      batchItemFailures: [{ itemIdentifier: "m1" }],
    }));

    await runLocalQueueConsumer(client, handler, {
      queueUrl,
      signal: controller.signal,
      waitTimeSeconds: 0,
      idleDelayMs: 0,
    });

    expect(commandNames(send)).not.toContain("DeleteMessageBatchCommand");
  });

  it("does not call the handler on an empty receive", async () => {
    const controller = new AbortController();
    const { client } = clientReturning([{}], controller);
    const handler = vi.fn<LocalQueueHandler>(async () => ({
      batchItemFailures: [],
    }));

    await runLocalQueueConsumer(client, handler, {
      queueUrl,
      signal: controller.signal,
      waitTimeSeconds: 0,
      idleDelayMs: 0,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("reports a receive failure and keeps polling rather than exiting", async () => {
    const controller = new AbortController();
    let call = 0;
    const send = vi.fn(async () => {
      call += 1;
      if (call === 1) throw new Error("queue unreachable");
      controller.abort();
      return {};
    });
    const onError = vi.fn();

    await runLocalQueueConsumer(
      { send } as unknown as SQSClient,
      async () => ({ batchItemFailures: [] }),
      {
        queueUrl,
        signal: controller.signal,
        waitTimeSeconds: 0,
        idleDelayMs: 0,
        errorDelayMs: 0,
        onError,
      },
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(call).toBeGreaterThan(1);
  });

  it("skips a message the queue returned without a receipt handle", async () => {
    const controller = new AbortController();
    const { client } = clientReturning(
      [{ Messages: [{ MessageId: "m1", Body: "{}" }] }],
      controller,
    );
    const handler = vi.fn<LocalQueueHandler>(async () => ({
      batchItemFailures: [],
    }));

    await runLocalQueueConsumer(client, handler, {
      queueUrl,
      signal: controller.signal,
      waitTimeSeconds: 0,
      idleDelayMs: 0,
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    [{ waitTimeSeconds: 21 }],
    [{ maxMessages: 0 }],
    [{ maxMessages: 11 }],
  ])("refuses options outside the SQS receive limits: %o", async (overrides) => {
    await expect(
      runLocalQueueConsumer(
        { send: vi.fn() } as unknown as SQSClient,
        async () => ({ batchItemFailures: [] }),
        { queueUrl, ...overrides },
      ),
    ).rejects.toThrow(RangeError);
  });
});
