import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LogoutForm } from "../../../../apps/web/src/features/shell/logout-form";

describe("LogoutForm", () => {
  it("posts to the session logout endpoint", () => {
    render(<LogoutForm className="drawer-logout" />);

    const form = screen.getByRole("button", { name: "Log out" }).closest("form");
    expect(form).toHaveAttribute("action", "/api/auth/logout");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveClass("drawer-logout");
  });
});
