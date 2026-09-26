import { describe, expect, it, vi } from "vitest";
import { StructuredLogger } from "../../../packages/observability/src/structured-logger";
import { monitoringContext } from "../../../packages/observability/src/monitoring-context";

describe("structured logger", () => {
  it("serializes only allowed fields and sanitized errors with correlation", () => {
    const write = vi.fn();
    const logger = new StructuredLogger({ write });
    const error = new Error(
      "password=very-secret https://s3.test/image?X-Amz-Signature=secret",
    );
    const fields = {
      statusCode: 403,
      errorCode: "FORBIDDEN",
      error,
      authorization: "Bearer token",
      payload: { image: "private-bytes" },
      errorMessage: "secret",
    };
    monitoringContext.run(
      {
        requestId: "request-1234",
        batchId: "batch-1234567890",
        route: "/api/jobs",
        environment: "production",
      },
      () => logger.log("error", "request_failed", fields),
    );
    const serialized: unknown = write.mock.calls[0]?.[0];
    expect(typeof serialized).toBe("string");
    expect(serialized).toContain('"errorMessage":"Request forbidden"');
    expect(serialized).toContain('"batchId":"batch-1234567890"');
    expect(serialized).not.toContain("very-secret");
    expect(serialized).not.toContain("Bearer");
    expect(serialized).not.toContain("private-bytes");
    expect(serialized).not.toContain("X-Amz");
  });
  it("drops invalid identifiers and URL paths, and isolates sink failures", () => {
    const write = vi.fn();
    const logger = new StructuredLogger({ write });
    logger.log("info", "safe", {
      route: "/api/jobs?token=secret",
      requestId: "forged\nsecret",
      durationMs: Number.NaN,
    });
    expect(write.mock.calls[0]?.[0]).not.toContain("secret");
    expect(
      new StructuredLogger({
        write: () => {
          throw new Error("sink failed");
        },
      }).log("info", "safe"),
    ).toBe(false);
  });
});
