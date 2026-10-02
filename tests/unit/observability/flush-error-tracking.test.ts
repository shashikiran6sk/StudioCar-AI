import { expect, it, vi } from "vitest";
vi.mock("@sentry/node", () => ({
  flush: vi.fn().mockRejectedValue(new Error("offline")),
}));
import { flush } from "@sentry/node";
import { flushErrorTracking } from "../../../packages/observability/src/flush-error-tracking";
it("flushes with a bounded wait and isolates transport failure", async () => {
  await expect(flushErrorTracking()).resolves.toBeUndefined();
  expect(flush).toHaveBeenCalledWith(2000);
});
