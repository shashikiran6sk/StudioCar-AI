import { expect, it, vi } from "vitest";
import { CloudWatchHttpMetrics } from "../../../packages/observability/src/cloudwatch-http-metrics";
import { createHttpMetrics } from "../../../packages/observability/src/create-http-metrics";
it("publishes aggregate metrics without identifiers or customer dimensions", async () => {
  const send = vi.fn().mockResolvedValue({});
  await new CloudWatchHttpMetrics(send).record(createHttpMetrics(403, 25));
  expect(send).toHaveBeenCalledOnce();
  expect(send.mock.calls[0]?.[0].input).toMatchObject({
    Namespace: "StudioCarAI/Operations",
    MetricData: expect.arrayContaining([
      expect.objectContaining({
        MetricName: "Http403",
        Dimensions: [{ Name: "Service", Value: "nextjs-api" }],
      }),
    ]),
  });
});
it("does not reject when CloudWatch is unavailable", async () => {
  await expect(
    new CloudWatchHttpMetrics(() => Promise.reject(new Error("failed"))).record(
      createHttpMetrics(200, 10),
    ),
  ).resolves.toBeUndefined();
});
