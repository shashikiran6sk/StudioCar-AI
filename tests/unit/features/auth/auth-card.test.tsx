import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthCard } from "../../../../apps/web/src/features/auth/auth-card";

describe("AuthCard", () => {
  it("labels the authentication region and renders optional guidance", () => {
    render(
      <AuthCard
        description="Use a verified identity."
        footer={<p>Secure access</p>}
        title="Sign in"
      >
        <button type="button">Continue</button>
      </AuthCard>,
    );

    expect(
      screen.getByRole("region", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Use a verified identity.")).toBeInTheDocument();
    expect(screen.getByText("Secure access")).toBeInTheDocument();
  });
  it("links its logo back to the homepage", () => {
    render(
      <AuthCard description="Continue to your workspace." title="Sign in">
        content
      </AuthCard>,
    );

    expect(
      screen.getByRole("link", { name: "StudioCar AI home" }),
    ).toHaveAttribute("href", "/");
  });
});
