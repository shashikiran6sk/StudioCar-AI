import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ButtonLink } from "../../../packages/ui/src/button-link";

describe("ButtonLink", () => {
  it("renders link semantics with button styling", () => {
    render(
      <ButtonLink href="/login" variant="primary">
        Sign in
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link.getAttribute("href")).toBe("/login");
    expect(link.className).toContain("sc-button--primary");
  });
});
