import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import robots from "../../../apps/web/src/app/robots";

const request = vi.hoisted(() => ({ host: "studiocarai.com" }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers({ host: request.host })),
}));

describe("robots route", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    request.host = "studiocarai.com";
  });

  it("allows the homepage and disallows actual private route trees", async () => {
    const result = await robots();
    expect(result.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: expect.arrayContaining([
        "/dashboard", "/inventory", "/settings", "/admin", "/login", "/auth", "/api",
      ]),
    });
    expect(result.sitemap).toBe("https://studiocarai.com/sitemap.xml");
  });

  it("disallows crawling outside canonical production", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await robots()).rules).toMatchObject({ disallow: "/" });
  });
});
