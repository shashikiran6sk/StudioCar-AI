import { expect, it, vi } from "vitest";
import { createUploadScheduler } from "../../../../apps/web/src/features/vehicle-create/create-upload-scheduler";

it("bounds active work, retains an aborted active slot until settlement, and skips cancelled queued work", async () => {
  const scheduler = createUploadScheduler(1);
  const active = new AbortController();
  let finish: (() => void) | undefined;
  const first = scheduler.run(() => new Promise<void>((resolve) => { finish = resolve; }), active.signal);
  await Promise.resolve();
  const queued = new AbortController();
  const cancelledOperation = vi.fn(async () => "cancelled");
  const cancelled = scheduler.run(cancelledOperation, queued.signal).catch(() => "aborted");
  const nextOperation = vi.fn(async () => "next");
  const next = scheduler.run(nextOperation, new AbortController().signal);
  queued.abort();
  active.abort();
  await Promise.resolve();
  expect(cancelledOperation).not.toHaveBeenCalled();
  expect(nextOperation).not.toHaveBeenCalled();
  if (!finish) throw new Error("Missing active operation");
  finish();
  await first;
  expect(await cancelled).toBe("aborted");
  expect(await next).toBe("next");
});
it("continues after rejection and refuses an already aborted operation", async () => {
  const scheduler = createUploadScheduler(1);
  await expect(scheduler.run(async () => { throw new Error("failed"); }, new AbortController().signal)).rejects.toThrow("failed");
  const controller = new AbortController();
  controller.abort();
  const operation = vi.fn(async () => "unused");
  await expect(scheduler.run(operation, controller.signal)).rejects.toBeDefined();
  expect(operation).not.toHaveBeenCalled();
  await expect(scheduler.run(async () => "recovered", new AbortController().signal)).resolves.toBe("recovered");
  expect(() => createUploadScheduler(0)).toThrow();
});
