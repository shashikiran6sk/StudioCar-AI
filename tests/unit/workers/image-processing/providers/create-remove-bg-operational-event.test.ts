import { expect, it } from "vitest";
import { createRemoveBgOperationalEvent } from "../../../../../workers/image-processing/src/providers/create-remove-bg-operational-event";
import { monitoringContext } from "../../../../../packages/observability/src/monitoring-context";
it("keeps ids out of metric dimensions and records fractional provider-reported usage", () => {
  const event = monitoringContext.run(
    { requestId: "request-1234", batchId: "batch-1234567890" },
    () =>
      createRemoveBgOperationalEvent({
        phase: "finished",
        success: true,
        statusCode: 200,
        durationMs: 18,
        creditsCharged: 0.25,
      }),
  );
  expect(event.correlation).toMatchObject({
    requestId: "request-1234",
    batchId: "batch-1234567890",
  });
  expect(event.dimensions).toEqual({ Provider: "remove.bg" });
  expect(event.metrics).toContainEqual({
    name: "removebg.credits.charged",
    unit: "Count",
    value: 0.25,
  });
  expect(event.metrics.map((m) => m.name)).not.toContain(
    "removebg.success.unreported_credits.count",
  );
});
it("counts unavailable credits separately from billed credits", () => {
  const names = createRemoveBgOperationalEvent({
    phase: "finished",
    success: true,
  }).metrics.map((m) => m.name);
  expect(names).toContain("removebg.success.unreported_credits.count");
  expect(names).not.toContain("removebg.credits.charged");
});
it.each([400, 401, 402, 403, 429, 500, 503])(
  "counts failed responses %s in their correct aggregates",
  (statusCode) => {
    const names = createRemoveBgOperationalEvent({
      phase: "finished",
      success: false,
      statusCode,
    }).metrics.map((m) => m.name);
    expect(names).toContain("removebg.failure.count");
    expect(names).toContain(
      statusCode >= 500 ? "removebg.status.5xx" : "removebg.status.4xx",
    );
    expect(names).not.toContain("removebg.request.count");
  },
);
