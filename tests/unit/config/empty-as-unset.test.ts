import { describe, expect, it } from "vitest";

import { S3ConnectionSchema } from "../../../packages/config/src/aws-connection";
import { AdminBootstrapEnvironmentSchema } from "../../../packages/config/src/environment";

/**
 * Exercised through the real settings built with it, so the test covers the
 * schemas the application actually runs rather than a copy of them.
 */
const Endpoint = S3ConnectionSchema.shape.S3_ENDPOINT;
const Email = AdminBootstrapEnvironmentSchema.shape.BOOTSTRAP_ADMIN_EMAIL;

describe("emptyAsUnset", () => {
  it("reads an empty value as not set", () => {
    // Environment files and docker-compose both send an unfilled value as "".
    expect(Endpoint.parse("")).toBeUndefined();
    expect(Email.parse("")).toBeUndefined();
  });

  it("reads an absent value as not set", () => {
    expect(Endpoint.parse(undefined)).toBeUndefined();
  });

  it("still validates and transforms a value that is present", () => {
    expect(Endpoint.parse("https://s3.ap-south-1.amazonaws.com")).toBe(
      "https://s3.ap-south-1.amazonaws.com",
    );
    expect(Email.parse(" Owner@Example.COM ")).toBe("owner@example.com");
  });

  it("still refuses a value that is present but wrong", () => {
    // Only an empty value is forgiven; a typo is not silently dropped.
    expect(Endpoint.safeParse("not-a-url").success).toBe(false);
    expect(Endpoint.safeParse("   ").success).toBe(false);
  });
});
