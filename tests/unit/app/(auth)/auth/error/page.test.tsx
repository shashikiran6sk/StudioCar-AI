import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthErrorPage from "../../../../../../apps/web/src/app/(auth)/auth/error/page";

describe("AuthErrorPage", () => {
  it("renders a safe failure and a route back to sign in", async () => {
    const page = await AuthErrorPage({
      searchParams: Promise.resolve({ code: "challenge_invalid" }),
    });

    render(page);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That sign-in attempt expired or was already used.",
    );
    expect(screen.getByRole("link", { name: "Return to sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
