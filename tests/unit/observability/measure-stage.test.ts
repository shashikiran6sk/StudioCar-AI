import { afterEach, expect, it, vi } from "vitest";
import { measureStage } from "../../../packages/observability/src/measure-stage";
import { monitoringContext } from "../../../packages/observability/src/monitoring-context";
import { PerformanceStage } from "../../../packages/observability/src/performance-stages.constants";
import type { MonitoringContext } from "../../../packages/observability/src/monitoring.types";

afterEach(() => vi.restoreAllMocks());

it("accumulates repeated work and includes failures without changing outcomes", async () => {
  const context: MonitoringContext = { timings: {} };
  const clock = vi.spyOn(performance, "now");
  clock.mockReturnValueOnce(10).mockReturnValueOnce(30).mockReturnValueOnce(40).mockReturnValueOnce(70);
  await monitoringContext.run(context, async () => {
    await expect(measureStage(PerformanceStage.SQS_PUBLICATION, () => Promise.resolve(202))).resolves.toBe(202);
    const failure = new Error("private provider message");
    await expect(measureStage(PerformanceStage.SQS_PUBLICATION, () => Promise.reject(failure))).rejects.toBe(failure);
  });
  expect(context.timings).toEqual({ sqsPublication: { count: 2, durationMs: 50 } });
});

it("isolates concurrent requests and works outside a monitored request", async () => {
  const first: MonitoringContext = { timings: {} };
  const second: MonitoringContext = { timings: {} };
  await Promise.all([
    monitoringContext.run(first, () => measureStage(PerformanceStage.AUTHENTICATION, () => Promise.resolve())),
    monitoringContext.run(second, () => measureStage(PerformanceStage.RESERVATION, () => Promise.resolve())),
  ]);
  expect(Object.keys(first.timings ?? {})).toEqual(["authentication"]);
  expect(Object.keys(second.timings ?? {})).toEqual(["reservation"]);
  await expect(measureStage(PerformanceStage.DISPATCH, () => Promise.resolve(1))).resolves.toBe(1);
  expect(monitoringContext.getStore()).toBeUndefined();
});
