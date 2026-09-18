import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "../../../packages/ui/src/card";

describe("Card", () => {
  it("applies the requested surface treatment", () => {
    render(<Card tone="dark">Usage remaining</Card>);
    expect(screen.getByText("Usage remaining")).toHaveClass("sc-card--dark");
  });
});

