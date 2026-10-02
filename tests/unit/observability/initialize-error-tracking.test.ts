import { expect, it, vi } from "vitest";
import { initializeErrorTracking } from "../../../packages/observability/src/initialize-error-tracking";
vi.mock("@sentry/node", () => ({ init: vi.fn() }));
import { init } from "@sentry/node";
it("disables unsolicited collection and leaves local sessions disconnected", () => {
  initializeErrorTracking({});
  expect(init).not.toHaveBeenCalled();
  initializeErrorTracking({
    APP_ENV: "production",
    SENTRY_DSN: "https://key@sentry.example/123",
    SENTRY_RELEASE: "commit-123",
  });
  expect(init).toHaveBeenCalledWith(
    expect.objectContaining({
      environment: "production",
      release: "commit-123",
      dataCollection: expect.objectContaining({
        userInfo: false,
        httpBodies: [],
        stackFrameVariables: false,
        frameContextLines: 0,
      }),
      defaultIntegrations: false,
      tracesSampleRate: 0,
      beforeSend: expect.any(Function),
    }),
  );
});
