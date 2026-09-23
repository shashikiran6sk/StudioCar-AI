import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioGallery } from "../../../../apps/web/src/features/portfolio/portfolio-gallery";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioGallery", () => {
  it("switches images and exposes only authorized per-image downloads", () => {
    render(<PortfolioGallery portfolio={PORTFOLIO_TEST_DATA} />);

    expect(screen.getByRole("slider", { name: "Compare original and processed image" }))
      .toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View image 2" }));
    expect(screen.getByText(/rear.jpg/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Download image" })).toHaveAttribute(
      "href",
      PORTFOLIO_TEST_DATA.images[1]?.downloadUrl,
    );
  });

  it("opens an accessible viewer and navigates the selected portfolio", () => {
    render(<PortfolioGallery portfolio={PORTFOLIO_TEST_DATA} />);

    fireEvent.click(screen.getByRole("button", { name: "Enter full screen" }));
    expect(screen.getByRole("dialog", { name: /full screen viewer/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByText("2 / 2")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("closes the viewer from a labelled button, not only with Escape", () => {
    render(<PortfolioGallery portfolio={PORTFOLIO_TEST_DATA} />);
    fireEvent.click(screen.getByRole("button", { name: "Enter full screen" }));

    // The × is decorative; the control is still announced by its words.
    const close = screen.getByRole("button", { name: "Close full screen" });
    expect(close).toHaveClass("portfolio-viewer__close");

    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
