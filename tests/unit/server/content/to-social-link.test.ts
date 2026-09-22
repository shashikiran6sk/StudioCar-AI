import { describe, expect, it } from "vitest";

import { toSocialLink } from "../../../../apps/web/src/server/content/to-social-link";

const record = {
  displayOrder: 0,
  enabled: true,
  label: "Instagram",
  platform: "INSTAGRAM" as const,
  url: "https://instagram.com/studiocar",
};

describe("toSocialLink", () => {
  it("keeps what a page needs to render a link", () => {
    expect(toSocialLink(record)).toEqual({
      enabled: true,
      label: "Instagram",
      platform: "INSTAGRAM",
      url: "https://instagram.com/studiocar",
    });
  });

  it("drops the ordering, which the query has already applied", () => {
    expect(toSocialLink(record)).not.toHaveProperty("displayOrder");
  });
});
