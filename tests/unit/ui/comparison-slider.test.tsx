import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComparisonSlider } from "../../../packages/ui/src/comparison-slider";

describe("ComparisonSlider", () => {
  it("uses a labelled native range control", () => {
    render(
      <ComparisonSlider
        after={<div>Processed image</div>}
        before={<div>Original image</div>}
        label="Compare original and processed image"
      />,
    );

    const slider = screen.getByRole("slider", { name: "Compare original and processed image" });
    fireEvent.change(slider, { target: { value: "72" } });
    expect(slider).toHaveValue("72");
  });
});

