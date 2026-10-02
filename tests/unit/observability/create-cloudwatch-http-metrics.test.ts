import { expect, it } from "vitest";
import { createCloudWatchHttpMetrics } from "../../../packages/observability/src/create-cloudwatch-http-metrics";
it("exports metrics only when explicitly configured", () => {
  expect(createCloudWatchHttpMetrics({})).toBeUndefined();
  expect(
    createCloudWatchHttpMetrics({
      APP_ENV: "production",
      AWS_REGION: "ap-south-1",
      HTTP_CLOUDWATCH_METRICS_ENABLED: "true",
    }),
  ).toBeDefined();
});
