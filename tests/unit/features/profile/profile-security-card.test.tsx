import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileSecurityCard } from "../../../../apps/web/src/features/profile/profile-security-card";

describe("ProfileSecurityCard", () => {
  it("shows active access and uses POST forms for both revocation scopes", () => {
    render(
      <ProfileSecurityCard
        activeSessionCount={3}
        currentSessionExpiresAt={new Date(2026, 9, 19, 12)}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Log out this device" }).closest("form"),
    ).toHaveAttribute("action", "/api/auth/logout");
    expect(
      screen.getByRole("button", { name: "Log out all devices" }).closest("form"),
    ).toHaveAttribute("action", "/api/auth/logout-all");
  });
});
