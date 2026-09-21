import { describe, expect, it } from "vitest";

import { createCloudWatchEmbeddedMetricPayload } from "../../../packages/observability/src/create-cloudwatch-embedded-metric-payload";
import {
  OperationalLogLevel,
  OperationalMetricUnit,
} from "../../../packages/observability/src/operational-telemetry.constants";

describe("createCloudWatchEmbeddedMetricPayload", () => {
  it("creates service aggregates and detailed dimensions without promoting IDs", () => {
    const payload = createCloudWatchEmbeddedMetricPayload({
      correlation: {
        jobId: "job-1",
        providerRequestId: "provider-request-1",
        userId: "user-1",
      },
      dimensions: { Outcome: "COMPLETED", Provider: "REMOVEBG" },
      eventName: "image_processing_completed",
      level: OperationalLogLevel.INFO,
      metrics: [
        {
          name: "ImagesProcessed",
          unit: OperationalMetricUnit.COUNT,
          value: 1,
        },
        {
          name: "ProviderLatencyMilliseconds",
          unit: OperationalMetricUnit.MILLISECONDS,
          value: 850,
        },
      ],
      service: "image-processing-worker",
      timestampMilliseconds: 1_790_000_000_000,
    });

    expect(payload).toEqual({
      _aws: {
        CloudWatchMetrics: [
          {
            Dimensions: [
              ["Service"],
              ["Service", "Outcome", "Provider"],
            ],
            Metrics: [
              { Name: "ImagesProcessed", Unit: "Count" },
              {
                Name: "ProviderLatencyMilliseconds",
                Unit: "Milliseconds",
              },
            ],
            Namespace: "StudioCarAI/Operations",
          },
        ],
        Timestamp: 1_790_000_000_000,
      },
      correlation: {
        jobId: "job-1",
        providerRequestId: "provider-request-1",
        userId: "user-1",
      },
      eventName: "image_processing_completed",
      ImagesProcessed: 1,
      level: "INFO",
      Outcome: "COMPLETED",
      Provider: "REMOVEBG",
      ProviderLatencyMilliseconds: 850,
      Service: "image-processing-worker",
    });
  });
});
