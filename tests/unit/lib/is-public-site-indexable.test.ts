import { describe, expect, it } from "vitest";

import { isPublicSiteIndexable } from "../../../apps/web/src/lib/is-public-site-indexable";

describe("isPublicSiteIndexable", () => {
  it("indexes only production on the canonical host", () => {
    expect(isPublicSiteIndexable("production", "production", "studiocarai.com")).toBe(true);
    expect(isPublicSiteIndexable("production", undefined, "studiocarai.com")).toBe(true);
    expect(isPublicSiteIndexable("local", undefined, "studiocarai.com")).toBe(false);
    expect(isPublicSiteIndexable("development", undefined, "studiocarai.com")).toBe(false);
    expect(isPublicSiteIndexable("production", "preview", "studiocarai.com")).toBe(false);
    expect(isPublicSiteIndexable("production", "production", "preview.vercel.app")).toBe(false);
    expect(isPublicSiteIndexable("production", "production", "localhost:3000")).toBe(false);
    expect(isPublicSiteIndexable("production", "production", "www.studiocarai.com")).toBe(false);
    expect(isPublicSiteIndexable(undefined, "preview", "studiocarai.com")).toBe(false);
  });
});
