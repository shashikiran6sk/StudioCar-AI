import { expect, it } from "vitest";
import { emitOperationalEvent } from "../../../packages/observability/src/emit-operational-event";
import { OperationalLogLevel } from "../../../packages/observability/src/operational-telemetry.constants";
it("isolates even a custom telemetry port throwing", () => {
  expect(
    emitOperationalEvent(
      {
        emit: () => {
          throw new Error("failed");
        },
      },
      {
        eventName: "test",
        service: "test",
        metrics: [],
        level: OperationalLogLevel.INFO,
        timestampMilliseconds: 0,
      },
    ),
  ).toBe(false);
});
