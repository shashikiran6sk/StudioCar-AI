import { describe, expect, it, vi } from "vitest";

import { OperationalTelemetry } from "../../../packages/observability/src/operational-telemetry";
import {
  OperationalLogLevel,
  OperationalMetricUnit,
} from "../../../packages/observability/src/operational-telemetry.constants";

describe("OperationalTelemetry", () => {
  it("writes one structured JSON event", () => {
    const write = vi.fn();
    const telemetry = new OperationalTelemetry({ write });

    expect(
      telemetry.emit({
        eventName: "storage_cleanup_completed",
        level: OperationalLogLevel.INFO,
        metrics: [
          {
            name: "DeletedObjectCount",
            unit: OperationalMetricUnit.COUNT,
            value: 2,
          },
        ],
        service: "storage-cleanup",
        timestampMilliseconds: 1_790_000_000_000,
      }),
    ).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(write.mock.calls[0]?.[0] ?? "{}")).toMatchObject({
      DeletedObjectCount: 2,
      eventName: "storage_cleanup_completed",
      Service: "storage-cleanup",
    });
  });

  it("does not let telemetry sink failures break application work", () => {
    const telemetry = new OperationalTelemetry({
      write() {
        throw new Error("stdout unavailable");
      },
    });

    expect(
      telemetry.emit({
        eventName: "image_processing_retry",
        level: OperationalLogLevel.WARN,
        metrics: [],
        service: "image-processing-worker",
        timestampMilliseconds: 1_790_000_000_000,
      }),
    ).toBe(false);
  });
});
