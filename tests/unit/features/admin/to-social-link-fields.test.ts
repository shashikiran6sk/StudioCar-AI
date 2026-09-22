import { describe, expect, it } from "vitest";

import { toSocialLinkFields } from "../../../../apps/web/src/features/admin/to-social-link-fields";
import { SOCIAL_PLATFORM_CATALOG } from "../../../../apps/web/src/server/content/social-platform-catalog";

const instagram = SOCIAL_PLATFORM_CATALOG[0];
const configured = {
  enabled: true,
  label: "Follow us",
  platform: "INSTAGRAM" as const,
  url: "https://instagram.com/studiocar",
};

describe("toSocialLinkFields", () => {
  it("fills the form from what is configured", () => {
    expect(instagram && toSocialLinkFields(instagram, [configured])).toEqual({
      configured: true,
      enabled: true,
      label: "Follow us",
      platform: "INSTAGRAM",
      platformLabel: "Instagram",
      url: "https://instagram.com/studiocar",
    });
  });

  it("offers a form for a platform nobody has configured yet", () => {
    expect(instagram && toSocialLinkFields(instagram, [])).toMatchObject({
      configured: false,
      url: "",
    });
  });

  it("starts an unconfigured platform hidden rather than live", () => {
    // Saving a blank form must never publish a link nobody reviewed.
    expect(instagram && toSocialLinkFields(instagram, [])).toMatchObject({
      enabled: false,
    });
  });

  it("ignores another platform's configuration", () => {
    expect(
      instagram &&
        toSocialLinkFields(instagram, [
          { ...configured, platform: "LINKEDIN" as const },
        ]),
    ).toMatchObject({ configured: false, url: "" });
  });
});
