import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const getAllSocialLinks = vi.fn();

vi.mock(
  "../../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock(
  "../../../../../../apps/web/src/server/content/get-social-links",
  () => ({ getAllSocialLinks, getEnabledSocialLinks: vi.fn() }),
);
vi.mock(
  "../../../../../../apps/web/src/server/content/social-link-actions",
  () => ({
    saveSocialLinkAction: vi.fn(),
    removeSocialLinkAction: vi.fn(),
  }),
);

const { default: AdminContentPage } = await import(
  "../../../../../../apps/web/src/app/(app)/admin/content/page"
);

describe("AdminContentPage", () => {
  it("authorizes for itself before reading any configuration", async () => {
    vi.clearAllMocks();
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(AdminContentPage()).rejects.toThrow("NOT_FOUND");
    expect(getAllSocialLinks).not.toHaveBeenCalled();
  });

  it("offers a form for every platform the footer can render", async () => {
    vi.clearAllMocks();
    requireAdministrator.mockResolvedValue({ userId: "admin-1" });
    getAllSocialLinks.mockResolvedValue([]);

    render(await AdminContentPage());

    expect(
      screen.getByRole("heading", { name: "Content and social links" }),
    ).toBeVisible();
    for (const platform of ["Instagram", "LinkedIn", "X", "YouTube", "Facebook"]) {
      expect(
        screen.getByRole("heading", { name: platform, level: 2 }),
      ).toBeVisible();
    }
    // Nothing is configured, so nothing can be removed.
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });

  it("fills in a platform that is already configured", async () => {
    vi.clearAllMocks();
    requireAdministrator.mockResolvedValue({ userId: "admin-1" });
    getAllSocialLinks.mockResolvedValue([
      {
        enabled: false,
        label: "Follow us",
        platform: "YOUTUBE",
        url: "https://youtube.com/@studiocar",
      },
    ]);

    render(await AdminContentPage());

    expect(
      screen.getByDisplayValue("https://youtube.com/@studiocar"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
  });
});
