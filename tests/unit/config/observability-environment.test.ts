import { describe, expect, it } from "vitest";
import { parseObservabilityEnvironment } from "../../../packages/config/src/observability-environment";

describe("observability configuration", () => {
  it("does not require credentials for local logs and strips unrelated secrets", () => {
    expect(
      parseObservabilityEnvironment({
        REMOVE_BG_API_KEY: "secret",
        SESSION_SECRET: "secret",
      }),
    ).toEqual({ HTTP_CLOUDWATCH_METRICS_ENABLED: "false" });
  });
  it("requires an environment and region before exporting metrics", () => {
    expect(() =>
      parseObservabilityEnvironment({
        HTTP_CLOUDWATCH_METRICS_ENABLED: "true",
      }),
    ).toThrow();
    expect(() =>
      parseObservabilityEnvironment({
        SENTRY_DSN: "https://key@sentry.example/123",
      }),
    ).toThrow();
    expect(
      parseObservabilityEnvironment({
        APP_ENV: "production",
        AWS_REGION: "ap-south-1",
        HTTP_CLOUDWATCH_METRICS_ENABLED: "true",
      }),
    ).toMatchObject({ AWS_REGION: "ap-south-1" });
  });
  it("rejects invalid endpoints and release strings", () => {
    expect(() =>
      parseObservabilityEnvironment({
        APP_ENV: "production",
        SENTRY_DSN: "http://key@sentry.example/123",
      }),
    ).toThrow();
    expect(() =>
      parseObservabilityEnvironment({
        SENTRY_RELEASE: "release with secret payload",
      }),
    ).toThrow();
  });
});
