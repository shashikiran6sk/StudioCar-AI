import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../../../apps/web/src/app/page";

describe("HomePage", () => {
  it("assembles the complete screenshot-derived product page", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Turn every vehicle photo into showroom material.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /complete portfolio in four steps/ }))
      .toBeVisible();
    expect(screen.getByRole("heading", { name: /Start free. Add capacity/ }))
      .toBeVisible();
    expect(screen.getByText("© 2026 StudioCar AI. All rights reserved.")).toBeVisible();
  });
});
