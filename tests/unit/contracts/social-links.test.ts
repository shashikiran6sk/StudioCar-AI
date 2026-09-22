import { describe, expect, it } from "vitest";

import {
  SocialLinkSchema,
  SocialLinkUrlSchema,
  SocialPlatformSchema,
} from "../../../packages/contracts/src/social-links";

describe("SocialLinkUrlSchema", () => {
  it("accepts a complete https address", () => {
    expect(SocialLinkUrlSchema.parse("  https://instagram.com/studiocar  ")).toBe(
      "https://instagram.com/studiocar",
    );
  });

  it("refuses plaintext, so the public is never downgraded", () => {
    expect(SocialLinkUrlSchema.safeParse("http://instagram.com/x").success).toBe(
      false,
    );
  });

  it("refuses a scheme that is not a web address at all", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://files.example.com",
    ]) {
      expect(SocialLinkUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("refuses an address that carries a password", () => {
    // Reads as a StudioCar address in a status bar, but is not one.
    expect(
      SocialLinkUrlSchema.safeParse("https://studiocar.example@evil.example/")
        .success,
    ).toBe(false);
    expect(
      SocialLinkUrlSchema.safeParse("https://user:pw@evil.example/studiocar")
        .success,
    ).toBe(false);
  });

  it("allows an @ in the path, which is how most handles are written", () => {
    expect(
      SocialLinkUrlSchema.safeParse("https://youtube.com/@studiocar").success,
    ).toBe(true);
    expect(
      SocialLinkUrlSchema.safeParse("https://x.com/search?q=%40studiocar")
        .success,
    ).toBe(true);
  });

  it("refuses an address with no host", () => {
    expect(SocialLinkUrlSchema.safeParse("https://").success).toBe(false);
    expect(SocialLinkUrlSchema.safeParse("instagram.com").success).toBe(false);
  });

  it("refuses an address longer than the column holds", () => {
    expect(
      SocialLinkUrlSchema.safeParse(`https://x.example/${"a".repeat(2049)}`)
        .success,
    ).toBe(false);
  });
});

describe("SocialLinkSchema", () => {
  const link = {
    enabled: true,
    label: "Instagram",
    platform: "INSTAGRAM",
    url: "https://instagram.com/studiocar",
  };

  it("accepts a complete link", () => {
    expect(SocialLinkSchema.parse(link)).toEqual(link);
  });

  it("refuses a platform the footer cannot render", () => {
    expect(
      SocialLinkSchema.safeParse({ ...link, platform: "MYSPACE" }).success,
    ).toBe(false);
  });

  it("refuses a link with nothing to click", () => {
    expect(SocialLinkSchema.safeParse({ ...link, label: "   " }).success).toBe(
      false,
    );
  });

  it("refuses an unknown field rather than dropping it", () => {
    expect(
      SocialLinkSchema.safeParse({ ...link, displayOrder: 0 }).success,
    ).toBe(false);
  });
});

describe("SocialPlatformSchema", () => {
  it("names every platform the footer knows how to render", () => {
    expect(SocialPlatformSchema.options).toEqual([
      "INSTAGRAM",
      "LINKEDIN",
      "X",
      "YOUTUBE",
      "FACEBOOK",
    ]);
  });
});
