import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "../../../packages/ui/src/brand-mark";

describe("BrandMark", () => {
  it("shows the product name when requested", () => {
    const { container } = render(<BrandMark withName />);
    expect(container.querySelector(".sc-brand__name")).toHaveTextContent("StudioCar AI");
    expect(screen.getByText("Studio")).toHaveClass("sc-brand__name-light");
  });

  it("draws the squircle mark instead of the retired SC initials", () => {
    const { container } = render(<BrandMark />);
    const mark = container.querySelector("svg.sc-brand__mark");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark?.querySelector("path")).toHaveAttribute("fill-rule", "evenodd");
    expect(container).not.toHaveTextContent("SC");
  });

  it("reverses for dark surfaces", () => {
    const { container } = render(<BrandMark inverted withName />);
    expect(container.firstChild).toHaveClass("sc-brand--inverted");
  });
});
