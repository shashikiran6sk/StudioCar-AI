import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateMetadata } from "../../../apps/web/src/app/page";

const request = vi.hoisted(() => ({ host: "studiocarai.com" }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers({ host: request.host })),
}));

describe("homepage metadata", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    request.host = "studiocarai.com";
  });

  it("uses the canonical production document and branded social metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("StudioCar AI | AI Car Photography for Dealers");
    expect(metadata.description).toContain("professional studio-quality images");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "StudioCar AI",
      url: new URL("https://studiocarai.com/"),
      title: metadata.title,
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: metadata.title });
    expect(JSON.stringify(metadata)).not.toMatch(/localhost|vercel\.app|studiocar\.ai/);
  });

  it("keeps preview and local requests out of the index", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: false });
    vi.stubEnv("VERCEL_ENV", "production");
    request.host = "preview.vercel.app";
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: false });
    vi.stubEnv("APP_ENV", "local");
    request.host = "localhost:3000";
    expect((await generateMetadata()).robots).toEqual({ index: false, follow: false });
  });

  it("adds Search Console verification only when a real token is configured", async () => {
    expect((await generateMetadata()).verification).toBeUndefined();
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "provided-token");
    expect((await generateMetadata()).verification).toEqual({ google: "provided-token" });
  });
});
