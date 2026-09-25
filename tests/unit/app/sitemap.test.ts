import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import sitemap from "../../../apps/web/src/app/sitemap";

const request = vi.hoisted(() => ({ host: "studiocarai.com" }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers({ host: request.host })),
}));

describe("sitemap route", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    request.host = "studiocarai.com";
  });

  it("lists exactly one public document without fragments or false modification dates", async () => {
    const result = await sitemap();
    expect(result).toEqual([{ url: "https://studiocarai.com/", changeFrequency: "monthly", priority: 1 }]);
    expect(JSON.stringify(result)).not.toMatch(/#|dashboard|inventory|admin|login|lastModified/);
  });

  it("publishes no URLs on previews", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await sitemap()).toEqual([]);
  });
});
