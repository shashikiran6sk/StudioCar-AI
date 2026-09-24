import { describe, expect, it } from "vitest";

import { applyEnvironmentProfile } from "../../../packages/config/src/apply-environment-profile";

describe("applyEnvironmentProfile", () => {
  it("fills Local defaults under the configured values", () => {
    const resolved = applyEnvironmentProfile({
      APP_ENV: "local",
      REMOVEBG_API_KEY: "remove-bg-key",
    });

    expect(resolved).toMatchObject({
      APP_ENV: "local",
      REMOVEBG_API_KEY: "remove-bg-key",
      S3_ENDPOINT: "http://localhost:9000",
      PHONE_OTP_DRIVER: "fake",
    });
  });

  it("lets an explicit value win over the profile", () => {
    expect(
      applyEnvironmentProfile({ APP_ENV: "local", S3_BUCKET: "my-bucket" })[
        "S3_BUCKET"
      ],
    ).toBe("my-bucket");
  });

  it("reads an empty value as not set", () => {
    expect(
      applyEnvironmentProfile({ APP_ENV: "local", S3_ENDPOINT: "" })[
        "S3_ENDPOINT"
      ],
    ).toBe("http://localhost:9000");
  });

  it("applies nothing when APP_ENV is absent or unknown", () => {
    const withoutEnvironment = { DATABASE_URL: "postgresql://x@db.example/x" };

    expect(applyEnvironmentProfile(withoutEnvironment)).toBe(withoutEnvironment);
    expect(applyEnvironmentProfile({ APP_ENV: "staging" })).toEqual({
      APP_ENV: "staging",
    });
  });

  it("drops every local queue default once any queue setting is configured", () => {
    const resolved = applyEnvironmentProfile({
      APP_ENV: "development",
      SQS_IMAGE_QUEUE_URL:
        "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-dev-images",
    });

    expect(resolved["SQS_ENDPOINT"]).toBeUndefined();
    expect(resolved["SQS_ACCESS_KEY_ID"]).toBeUndefined();
    expect(resolved["SQS_SECRET_ACCESS_KEY"]).toBeUndefined();
  });

  it("does not mutate the values it was given", () => {
    const values = { APP_ENV: "local" };
    applyEnvironmentProfile(values);

    expect(values).toEqual({ APP_ENV: "local" });
  });
});
