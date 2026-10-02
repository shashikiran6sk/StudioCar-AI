import { describe, expect, it } from "vitest";

import { metadata } from "../../../apps/web/src/app/layout";

describe("root metadata", () => {
  it("sets the production metadata base and defaults private", () => {
    expect(String(metadata.metadataBase)).toBe("https://studiocarai.com/");
    expect(metadata.title).toBe("StudioCar AI | AI Car Photography for Dealers");
    expect(metadata.description).toContain("vehicle photos");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("advertises stable square favicon URLs with their actual resolutions", () => {
    expect(metadata.icons).toEqual({
      icon: [
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      ],
      apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    });
  });
});
