import { beforeEach, describe, expect, it, vi } from "vitest";

const lifecycle = vi.hoisted(() => ({
  after: vi.fn<(callback: () => Promise<void>) => void>(),
  report: vi.fn(),
}));
vi.mock("next/server", () => ({ after: lifecycle.after }));
vi.mock("../../../../packages/observability/src/report-unexpected-error", () => ({
  reportUnexpectedError: lifecycle.report,
}));

import { scheduleProcessingDispatch } from "../../../../apps/web/src/server/jobs/schedule-processing-dispatch";
import type { ProcessingDispatchPort } from "../../../../apps/web/src/server/jobs/processing-job.types";

beforeEach(() => vi.resetAllMocks());

describe("scheduleProcessingDispatch", () => {
  it("returns before queue work and publishes only in the response lifecycle", async () => {
    const dispatch = vi.fn<ProcessingDispatchPort["dispatch"]>().mockResolvedValue({
      claimed: 20, failed: 0, published: 20,
    });
    const request = { jobIds: ["job-1", "job-2"] };

    scheduleProcessingDispatch({ dispatch }, request);

    expect(dispatch).not.toHaveBeenCalled();
    const callback = lifecycle.after.mock.calls[0]?.[0];
    expect(callback).toBeDefined();
    await callback?.();
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(request);
  });

  it("reports publication failure without rejecting the accepted request", async () => {
    const error = new Error("queue unavailable");
    const dispatch = vi.fn<ProcessingDispatchPort["dispatch"]>().mockRejectedValue(error);
    scheduleProcessingDispatch({ dispatch }, { jobIds: ["job-1"] });

    const callback = lifecycle.after.mock.calls[0]?.[0];
    expect(callback).toBeDefined();
    await expect(callback?.()).resolves.toBeUndefined();
    expect(lifecycle.report).toHaveBeenCalledWith(error, "INTERNAL_ERROR");
  });

  it("leaves durable recovery responsible when lifecycle registration fails", () => {
    const error = new Error("lifecycle unavailable");
    lifecycle.after.mockImplementation(() => { throw error; });
    const dispatch = vi.fn<ProcessingDispatchPort["dispatch"]>();

    expect(() => scheduleProcessingDispatch({ dispatch }, { jobIds: ["job-1"] })).not.toThrow();
    expect(dispatch).not.toHaveBeenCalled();
    expect(lifecycle.report).toHaveBeenCalledWith(error, "INTERNAL_ERROR");
  });
});
