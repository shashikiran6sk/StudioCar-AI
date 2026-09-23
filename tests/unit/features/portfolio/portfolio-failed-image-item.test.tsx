import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioFailedImageItem } from "../../../../apps/web/src/features/portfolio/portfolio-failed-image-item";
import { ATTENTION_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioFailedImageItem", () => {
  it("shows the original, its position, and the reason it failed", () => {
    const image = ATTENTION_TEST_DATA.failedImages[1];
    if (!image) throw new Error("Fixture image missing.");

    render(<PortfolioFailedImageItem image={image} />);

    expect(screen.getByRole("img", { name: "Image 4 original" })).toBeVisible();
    expect(screen.getByText(/interior\.heic\.jpg/)).toBeVisible();
    expect(screen.getByText(/Replace it with another photo/)).toBeVisible();
  });
});
