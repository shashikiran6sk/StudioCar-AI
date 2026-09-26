import { expect, it } from "vitest";
import { monitoringContext } from "../../../packages/observability/src/monitoring-context";
it("isolates interleaved requests and clears context after completion", async () => {
  const results = await Promise.all(
    ["first-request", "second-request"].map((requestId) =>
      monitoringContext.run({ requestId }, async () => {
        await Promise.resolve();
        return monitoringContext.getStore()?.requestId;
      }),
    ),
  );
  expect(results).toEqual(["first-request", "second-request"]);
  expect(monitoringContext.getStore()).toBeUndefined();
});
