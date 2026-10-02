import { expect, it, vi } from "vitest";
vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  withScope: (
    callback: (scope: { setTag: (key: string, value: string) => void }) => void,
  ) => callback({ setTag: vi.fn() }),
}));
import { captureException } from "@sentry/node";
import { reportUnexpectedError } from "../../../packages/observability/src/report-unexpected-error";
import { ApplicationErrorCode } from "../../../packages/observability/src/monitoring.constants";
it("reports a sanitized exception rather than the raw error cause", () => {
  reportUnexpectedError(
    new Error("api-key=secret"),
    ApplicationErrorCode.SQS_JOB_FAILED,
  );
  const captured: unknown = vi.mocked(captureException).mock.calls[0]?.[0];
  expect(captured).toBeInstanceOf(Error);
  if (!(captured instanceof Error)) throw new Error("Missing error");
  expect(captured.message).not.toContain("secret");
  expect(captured.cause).toBeUndefined();
});
