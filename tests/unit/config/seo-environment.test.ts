import { describe, expect, it } from "vitest";

import { parseSeoEnvironment } from "../../../packages/config/src/seo-environment";

describe("parseSeoEnvironment", () => {
  it("accepts an optional Search Console token and validates the deployment stage", () => {
    expect(parseSeoEnvironment({ APP_ENV: "production", VERCEL_ENV: "production" }))
      .toEqual({ APP_ENV: "production", VERCEL_ENV: "production" });
    expect(parseSeoEnvironment({ APP_ENV: "production", GOOGLE_SITE_VERIFICATION: "token" }))
      .toMatchObject({ GOOGLE_SITE_VERIFICATION: "token" });
    expect(parseSeoEnvironment({ VERCEL_ENV: "preview" })).toEqual({ VERCEL_ENV: "preview" });
    expect(() => parseSeoEnvironment({ APP_ENV: "unknown" })).toThrow();
    expect(() => parseSeoEnvironment({ APP_ENV: "production", VERCEL_ENV: "unknown" })).toThrow();
  });
});
