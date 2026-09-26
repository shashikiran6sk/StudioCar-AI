import { expect, it } from "vitest";
import { getRequestId } from "../../../packages/observability/src/get-request-id";
import { monitoringContext } from "../../../packages/observability/src/monitoring-context";
it("reuses a current request id and otherwise generates a UUID", () => {
  expect(
    monitoringContext.run({ requestId: "request-1234" }, getRequestId),
  ).toBe("request-1234");
  expect(getRequestId()).toMatch(/^[0-9a-f-]{36}$/);
});
