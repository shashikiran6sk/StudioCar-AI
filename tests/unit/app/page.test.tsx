import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../../../apps/web/src/app/page";

describe("foundation home page", () => {
  it("identifies the StudioCar AI workspace", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "StudioCar AI" })).toBeDefined();
    expect(screen.getByText("Foundation ready")).toBeDefined();
  });
});
