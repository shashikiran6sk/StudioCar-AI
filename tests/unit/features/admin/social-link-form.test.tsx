import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../apps/web/src/server/content/social-link-actions", () => ({
  saveSocialLinkAction: vi.fn(),
  removeSocialLinkAction: vi.fn(),
}));

const { SocialLinkForm } = await import(
  "../../../../apps/web/src/features/admin/social-link-form"
);

const configured = {
  configured: true,
  enabled: true,
  label: "Follow us",
  platform: "INSTAGRAM",
  platformLabel: "Instagram",
  url: "https://instagram.com/studiocar",
};

describe("SocialLinkForm", () => {
  it("shows the configured address and text", () => {
    render(<SocialLinkForm link={configured} />);

    expect(screen.getByLabelText(/Address/)).toHaveValue(
      "https://instagram.com/studiocar",
    );
    expect(screen.getByLabelText(/Link text/)).toHaveValue("Follow us");
    expect(screen.getByLabelText(/Show in the footer/)).toBeChecked();
  });

  it("carries the platform the submission applies to", () => {
    const { container } = render(<SocialLinkForm link={configured} />);

    for (const input of container.querySelectorAll('input[name="platform"]')) {
      expect(input).toHaveValue("INSTAGRAM");
    }
  });

  it("suggests the platform's own name when nothing is configured", () => {
    render(
      <SocialLinkForm
        link={{ ...configured, configured: false, label: "", url: "" }}
      />,
    );

    expect(screen.getByLabelText(/Link text/)).toHaveValue("Instagram");
    expect(screen.getByLabelText(/Address/)).toHaveValue("");
  });

  it("offers removal only for a platform that has a link", () => {
    render(<SocialLinkForm link={configured} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();

    render(
      <SocialLinkForm
        link={{ ...configured, configured: false, platform: "LINKEDIN" }}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
  });

  it("keeps two platforms' controls distinct on one page", () => {
    render(
      <>
        <SocialLinkForm link={configured} />
        <SocialLinkForm
          link={{
            ...configured,
            platform: "LINKEDIN",
            platformLabel: "LinkedIn",
          }}
        />
      </>,
    );

    // Duplicate ids would point both labels at the same input.
    expect(screen.getAllByLabelText(/Address/)).toHaveLength(2);
  });
});
