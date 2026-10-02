import { describe, expect, it } from "vitest";

import { monitoringContext } from "../../../../../packages/observability/src/monitoring-context";
import { createProviderOperationalEvent } from "../../../../../workers/image-processing/src/providers/create-provider-operational-event";
import type { ProviderFailureCategory } from "../../../../../workers/image-processing/src/providers/provider-failure.types";
import { PROVIDER_FAILURE_METRICS } from "../../../../../workers/image-processing/src/providers/provider-telemetry.constants";

const BASE = {
  cost: null,
  durationMilliseconds: 4_200,
  failureCategory: null,
  finishedAtMilliseconds: 1_000,
};

describe("createProviderOperationalEvent", () => {
  it("records a successful exchange with bounded dimensions and correlation", () => {
    const event = monitoringContext.run(
      { batchId: "batch-1", jobId: "job-1", queueMessageId: "message-1", requestId: "request-1" },
      () => createProviderOperationalEvent(BASE),
    );
    expect(event).toEqual({
      correlation: {
        batchId: "batch-1",
        jobId: "job-1",
        queueMessageId: "message-1",
        requestId: "request-1",
      },
      dimensions: { Provider: "Leonardo" },
      eventName: "provider_exchange",
      level: "INFO",
      metrics: [
        { name: "ProviderRequestCount", unit: "Count", value: 1 },
        { name: "ProviderSuccessCount", unit: "Count", value: 1 },
        { name: "ProviderExchangeDurationMilliseconds", unit: "Milliseconds", value: 4_200 },
      ],
      service: "image-processing-worker",
      timestampMilliseconds: 1_000,
    });
  });

  const CATEGORIES: readonly ProviderFailureCategory[] = [
    "AUTHORIZATION",
    "CONTENT_BLOCKED",
    "DOWNLOAD_FAILED",
    "INVALID_OUTPUT",
    "INVALID_RESPONSE",
    "NETWORK",
    "PAYMENT_REQUIRED",
    "RATE_LIMITED",
    "REJECTED",
    "SERVER_ERROR",
    "SOURCE_UNAVAILABLE",
    "TIMEOUT",
  ];

  it.each(CATEGORIES)("counts a %s failure under its own metric", (failureCategory) => {
    const event = createProviderOperationalEvent({ ...BASE, failureCategory });
    expect(event.level).toBe("WARN");
    expect(event.metrics.map(({ name }) => name)).toEqual([
      "ProviderRequestCount",
      "ProviderFailureCount",
      "ProviderExchangeDurationMilliseconds",
      PROVIDER_FAILURE_METRICS[failureCategory],
    ]);
  });

  it("names a distinct metric for every category", () => {
    expect(new Set(Object.values(PROVIDER_FAILURE_METRICS)).size).toBe(CATEGORIES.length);
  });

  it.each([
    [{ amount: "3", unit: "CREDITS" }, "ProviderCostCredits", 3],
    [{ amount: 0.0425, unit: "DOLLARS" }, "ProviderCostDollars", 0.0425],
  ] as const)("records reported cost %o", (cost, name, value) => {
    expect(createProviderOperationalEvent({ ...BASE, cost }).metrics).toContainEqual({
      name,
      unit: "None",
      value,
    });
  });

  it("clamps a negative clock skew to zero duration", () => {
    expect(
      createProviderOperationalEvent({ ...BASE, durationMilliseconds: -5 }).metrics,
    ).toContainEqual({
      name: "ProviderExchangeDurationMilliseconds",
      unit: "Milliseconds",
      value: 0,
    });
  });
});
