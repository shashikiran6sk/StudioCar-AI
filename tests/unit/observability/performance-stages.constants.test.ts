import { expect, it } from "vitest";
import { PerformanceStage } from "../../../packages/observability/src/performance-stages.constants";
import { StructuredLogger } from "../../../packages/observability/src/structured-logger";

it("emits only bounded stage names and finite nonnegative timings", () => {
  const lines: string[] = [];
  const logger = new StructuredLogger({ write: (line) => lines.push(line) });
  const timings = {
    [PerformanceStage.RESERVATION]: { durationMs: 12, count: 1 },
    [PerformanceStage.AUTHENTICATION]: { durationMs: Number.NaN, count: 1 },
    [PerformanceStage.SQS_PUBLICATION]: { durationMs: 4, count: -1 },
    privateSignedUrl: { durationMs: 99, count: 1 },
  };
  logger.log("info", "http_request_completed", { timings });
  expect(lines[0]).toContain('"timings":{"reservation":{"durationMs":12,"count":1}}');
  expect(lines[0]).not.toContain("privateSignedUrl");
});
