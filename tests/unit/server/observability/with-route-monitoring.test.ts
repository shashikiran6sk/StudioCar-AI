import { beforeEach, expect, it, vi } from "vitest";
import { withRouteMonitoring } from "../../../../apps/web/src/server/observability/with-route-monitoring";
import { createApiErrorResponse } from "../../../../apps/web/src/server/auth/create-api-error-response";
import { logger } from "../../../../packages/observability/src/structured-logger";
import { monitoringContext } from "../../../../packages/observability/src/monitoring-context";

const callbacks = vi.hoisted(() => ({
  tasks: new Array<() => Promise<void>>(),
}));
vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => {
    callbacks.tasks.push(task);
  },
}));
beforeEach(() => {
  callbacks.tasks.length = 0;
  vi.restoreAllMocks();
});
it("uses one id for context, error body, response header and status log", async () => {
  const log = vi.spyOn(logger, "log");
  const id = "7e38d07b-c3c3-4ce0-9a50-91055e9bf3de";
  const route = withRouteMonitoring("/api/jobs", () =>
    createApiErrorResponse({
      status: 403,
      code: "FORBIDDEN",
      message: "Denied",
      requestId: "other-request",
    }),
  );
  const response = await route(
    new Request("https://app.test/api/jobs?token=secret", {
      headers: { "x-request-id": id, authorization: "Bearer secret" },
    }),
  );
  expect(response.headers.get("x-request-id")).toBe(id);
  const body: unknown = await response.json();
  expect(body).toMatchObject({ error: { requestId: id } });
  expect(log).toHaveBeenCalledWith(
    "warn",
    "http_request_completed",
    expect.objectContaining({ statusCode: 403, errorCode: "FORBIDDEN" }),
  );
  expect(monitoringContext.getStore()).toBeUndefined();
  expect(callbacks.tasks).toHaveLength(1);
});
it("generates an id for unsafe input and reports thrown exceptions as safe 500s", async () => {
  const route = withRouteMonitoring("/api/jobs", () => {
    throw new Error("password=secret");
  });
  const response = await route(
    new Request("https://app.test/api/jobs", {
      headers: { "x-request-id": "forged-secret" },
    }),
  );
  expect(response.status).toBe(500);
  expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  expect(await response.text()).not.toContain("secret");
});
it("retains dynamic route parameters and success payload", async () => {
  const route = withRouteMonitoring(
    "/api/uploads/[assetId]",
    (_request: Request, context: { params: Promise<{ assetId: string }> }) =>
      context.params.then((params) => Response.json(params)),
  );
  const response = await route(new Request("https://app.test/api/uploads/1"), {
    params: Promise.resolve({ assetId: "1" }),
  });
  expect(await response.json()).toEqual({ assetId: "1" });
});

it("keeps immutable redirects and deferred telemetry outages from changing the response", async () => {
  const route = withRouteMonitoring("/api/auth/google/start", () =>
    Response.redirect("https://identity.test/start", 302),
  );
  const response = await route(
    new Request("https://app.test/api/auth/google/start"),
  );
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://identity.test/start");
  expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  await Promise.all(callbacks.tasks.map((task) => task()));
  expect(response.status).toBe(302);
});
