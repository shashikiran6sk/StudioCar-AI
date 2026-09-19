import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountMenu } from "../../../../apps/web/src/features/shell/account-menu";

describe("AccountMenu", () => {
  it("shows the user identity and posts logout to the session endpoint", () => {
    render(
      <AccountMenu
        user={{
          id: "user-1",
          displayName: "Priya Sharma",
          primaryEmail: "priya@example.com",
          primaryPhone: null,
        }}
      />,
    );

    expect(
      screen.getByLabelText("Account menu for Priya Sharma"),
    ).toBeInTheDocument();
    expect(screen.getByText("PS")).toBeInTheDocument();
    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Profile & security" }),
    ).toHaveAttribute("href", "/settings/profile");
    expect(screen.getByRole("button", { name: "Log out" }).closest("form"))
      .toHaveAttribute("action", "/api/auth/logout");
  });
});
