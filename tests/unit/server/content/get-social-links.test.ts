import { describe, expect, it, vi } from "vitest";

const findEnabled = vi.fn();
const findAll = vi.fn();

vi.mock("../../../../apps/web/src/server/content/social-link-runtime", () => ({
  getSocialLinkRepository: () => ({ findEnabled, findAll }),
}));

const { getAllSocialLinks, getEnabledSocialLinks } = await import(
  "../../../../apps/web/src/server/content/get-social-links"
);

const record = {
  displayOrder: 0,
  enabled: true,
  label: "Instagram",
  platform: "INSTAGRAM",
  url: "https://instagram.com/studiocar",
};

describe("getEnabledSocialLinks", () => {
  it("reads what an administrator configured", async () => {
    findEnabled.mockResolvedValue([record]);

    await expect(getEnabledSocialLinks()).resolves.toEqual([
      {
        enabled: true,
        label: "Instagram",
        platform: "INSTAGRAM",
        url: "https://instagram.com/studiocar",
      },
    ]);
  });

  it("invents nothing when none is configured", async () => {
    findEnabled.mockResolvedValue([]);

    // A footer link is an address somebody will follow. There is no default.
    await expect(getEnabledSocialLinks()).resolves.toEqual([]);
  });
});

describe("getAllSocialLinks", () => {
  it("includes a link an administrator has hidden", async () => {
    findAll.mockResolvedValue([{ ...record, enabled: false }]);

    await expect(getAllSocialLinks()).resolves.toMatchObject([
      { platform: "INSTAGRAM", enabled: false },
    ]);
  });
});
