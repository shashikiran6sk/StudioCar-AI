import { describe, expect, it } from "vitest";

import { metadata } from "../../../apps/web/src/app/layout";

describe("root metadata", () => {
  it("sets the production metadata base and defaults private", () => {
    expect(String(metadata.metadataBase)).toBe("https://studiocarai.com/");
    expect(metadata.title).toBe("StudioCar AI | AI Car Photography for Dealers");
    expect(metadata.description).toContain("vehicle photos");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
