import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { ProcessingOutboxDispatcher } from "../../../packages/processing/src/processing-outbox-dispatcher";
import type { ProcessingOutboxRepositoryPort, ProcessingQueuePort } from "../../../packages/processing/src/processing-outbox.types";

const now = new Date("2026-09-28T00:00:00Z");
const options = { batchSize: 20, claimTtlMilliseconds: 30_000, retryBaseMilliseconds: 1000, retryMaximumMilliseconds: 60_000 };
function fixture() {
  const messages = Array.from({ length: 20 }, () => ({ id: randomUUID(), jobId: randomUUID(), attemptCount: 1, createdAt: now }));
  const publish = vi.fn<NonNullable<ProcessingQueuePort["publishBatch"]>>().mockImplementation(async (jobs) => jobs.map((job) => ({ jobId: job.jobId, outcome: "PUBLISHED", messageId: randomUUID() })));
  const acknowledge = vi.fn<NonNullable<ProcessingOutboxRepositoryPort["markOutboxPublishedBatch"]>>().mockImplementation(async (commands) => commands.map((command) => command.messageId));
  const release = vi.fn<ProcessingOutboxRepositoryPort["releaseOutboxClaim"]>().mockResolvedValue(true);
  const repository: ProcessingOutboxRepositoryPort = { claimPendingOutbox: vi.fn().mockResolvedValue(messages),
    markOutboxPublished: vi.fn(), markOutboxPublishedBatch: acknowledge, releaseOutboxClaim: release };
  const queue: ProcessingQueuePort = { publish: vi.fn(), publishBatch: publish };
  return { messages, publish, acknowledge, release, repository, queue };
}

it("publishes twenty messages in two bounded calls and acknowledges only afterward", async () => {
  const f = fixture();
  expect(await new ProcessingOutboxDispatcher(f.repository, f.queue, options, () => now).dispatch()).toEqual({ claimed: 20, published: 20, failed: 0 });
  expect(f.publish).toHaveBeenCalledTimes(2);
  expect(f.publish.mock.calls.map(([messages]) => messages.length)).toEqual([10, 10]);
  expect(f.acknowledge).toHaveBeenCalledTimes(2);
  expect(f.publish.mock.invocationCallOrder[0]).toBeLessThan(f.acknowledge.mock.invocationCallOrder[0] ?? 0);
  expect(f.repository.markOutboxPublished).not.toHaveBeenCalled();
  expect(f.queue.publish).not.toHaveBeenCalled();
  expect(f.release).not.toHaveBeenCalled();
});
it("retries only failed or missing items inside a successful response", async () => {
  const f = fixture();
  f.publish.mockImplementation(async (jobs) => jobs.slice(1).map((job) => ({ jobId: job.jobId, outcome: "PUBLISHED", messageId: randomUUID() })));
  expect(await new ProcessingOutboxDispatcher(f.repository, f.queue, options, () => now).dispatch()).toEqual({ claimed: 20, published: 18, failed: 2 });
  expect(f.release).toHaveBeenCalledTimes(2);
  expect(f.acknowledge.mock.calls.map(([items]) => items.length)).toEqual([9, 9]);
});
it("retains retry intent after SQS succeeds but database acknowledgement fails", async () => {
  const f = fixture();
  f.acknowledge.mockRejectedValueOnce(new Error("database unavailable"));
  expect(await new ProcessingOutboxDispatcher(f.repository, f.queue, options, () => now).dispatch()).toEqual({ claimed: 20, published: 10, failed: 10 });
  expect(f.release).toHaveBeenCalledTimes(10);
});
it("does not begin another send after the claim lease expires", async () => {
  const f = fixture();
  let clock = now;
  f.publish.mockImplementation(async (jobs) => {
    clock = new Date(now.getTime() + options.claimTtlMilliseconds);
    return jobs.map((job) => ({ jobId: job.jobId, outcome: "PUBLISHED", messageId: randomUUID() }));
  });
  expect(await new ProcessingOutboxDispatcher(f.repository, f.queue, options, () => clock).dispatch()).toEqual({ claimed: 20, published: 10, failed: 10 });
  expect(f.publish).toHaveBeenCalledTimes(1);
  expect(f.publish.mock.calls[0]?.[1]).toBeLessThan(options.claimTtlMilliseconds);
});
it("releases a transport failure without treating it as an acknowledgement", async () => {
  const f = fixture();
  f.publish.mockRejectedValue(new Error("SQS timeout"));
  expect(await new ProcessingOutboxDispatcher(f.repository, f.queue, options, () => now).dispatch()).toEqual({ claimed: 20, published: 0, failed: 20 });
  expect(f.acknowledge).not.toHaveBeenCalled();
});
