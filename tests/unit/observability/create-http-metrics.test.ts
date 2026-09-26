import { expect, it } from "vitest";
import { createHttpMetrics } from "../../../packages/observability/src/create-http-metrics";
it.each([200, 201, 302, 400, 401, 403, 404, 500, 503])(
  "counts status %s once without overlapping groups incorrectly",
  (status) => {
    const metrics = createHttpMetrics(status, 17);
    expect(metrics.filter((m) => m.name === "HttpRequests")).toEqual([
      { name: "HttpRequests", unit: "Count", value: 1 },
    ]);
    const names = metrics.map((m) => m.name);
    expect(names.includes("Http2xx")).toBe(status >= 200 && status < 300);
    expect(names.includes("Http401")).toBe(status === 401);
    expect(names.includes("Http403")).toBe(status === 403);
    expect(names.includes("Http4xx")).toBe(status >= 400 && status < 500);
    expect(names.includes("Http5xx")).toBe(status >= 500);
    expect(metrics.find((m) => m.name === "HttpDuration")?.value).toBe(17);
  },
);
