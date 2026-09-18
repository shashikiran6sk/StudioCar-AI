import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "../../../packages/ui/src/brand-mark";

describe("BrandMark", () => {
  it("shows the product name when requested", () => {
    render(<BrandMark withName />);
    expect(screen.getByText("StudioCar AI")).toBeInTheDocument();
  });
});

