import { expect, it } from "vitest";
import { ApplicationError } from "../../../packages/observability/src/application-error";
import { ApplicationErrorCode } from "../../../packages/observability/src/monitoring.constants";
it("keeps the original error as cause without including its message", () => {
  const cause = new Error("private provider details");
  const error = new ApplicationError(
    ApplicationErrorCode.REMOVE_BG_FAILED,
    cause,
  );
  expect(error.cause).toBe(cause);
  expect(error.message).not.toContain(cause.message);
});
