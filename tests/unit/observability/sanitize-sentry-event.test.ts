import { expect, it } from "vitest";
import { sanitizeSentryEvent } from "../../../packages/observability/src/sanitize-sentry-event";
it("removes requests, user data, breadcrumbs, source context, extra payloads and exception text", () => {
  const clean = sanitizeSentryEvent({
    type: undefined,
    request: {
      headers: { authorization: "Bearer secret" },
      data: "private-image",
    },
    user: { email: "user@secret.example" },
    extra: { key: "provider-secret" },
    breadcrumbs: [{ message: "private payload" }],
    tags: {
      requestId: "request-1234",
      batchId: "batch-1234567890",
      token: "secret",
    },
    exception: {
      values: [
        {
          type: "Error",
          value: "provider-secret",
          stacktrace: {
            frames: [
              {
                filename: "/app/worker.ts",
                lineno: 10,
                colno: 2,
                pre_context: ["provider-secret"],
                vars: { token: "secret" },
              },
              { filename: "https://host/file.js?token=secret" },
            ],
          },
        },
      ],
    },
  });
  expect(clean?.tags).toEqual({
    requestId: "request-1234",
    batchId: "batch-1234567890",
  });
  expect(clean?.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject({
    filename: "/app/worker.ts",
    lineno: 10,
  });
  expect(JSON.stringify(clean)).not.toContain("secret");
  expect(JSON.stringify(clean)).not.toContain("private");
  expect(
    sanitizeSentryEvent({ type: undefined, message: "secret" }),
  ).toBeNull();
});
