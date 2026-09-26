import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PortfolioGallery } from "../../../../apps/web/src/features/portfolio/portfolio-gallery";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioGallery", () => {
  beforeEach(() => {
    // jsdom does not implement native modal dialog methods.
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }),
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }),
    });
  });

  it.each([0, 7, 8, 9, 13, 18])("caps the thumbnail grid for %i images", (count) => {
    const firstImage = PORTFOLIO_TEST_DATA.images[0];
    if (!firstImage) throw new Error("An image fixture is required.");
    const images = Array.from({ length: count }, (_, index) => ({
      ...firstImage,
      id: `image-${String(index)}`,
      originalFilename: `image-${String(index + 1)}.jpg`,
    }));
    render(<PortfolioGallery portfolio={{ ...PORTFOLIO_TEST_DATA, images }} />);
    if (count === 0) {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      return;
    }
    const grid = within(screen.getByLabelText("Portfolio images"));
    expect(grid.getAllByRole("button")).toHaveLength(Math.min(count, 8));
    if (count <= 8) {
      expect(grid.queryByRole("button", { name: /View all/ })).not.toBeInTheDocument();
      return;
    }
    expect(grid.getAllByRole("button", { name: /View image/ })).toHaveLength(7);
    const overflow = grid.getByRole("button", { name: `View all ${String(count)} images` });
    expect(overflow).toHaveTextContent(`+${String(count - 7)}`);
    fireEvent.click(overflow);
    const viewer = within(screen.getByRole("dialog"));
    expect(viewer.getByText(`8 / ${String(count)}`)).toBeVisible();
    expect(viewer.getAllByRole("button", { name: /View image/ })).toHaveLength(count);
    fireEvent.click(viewer.getByRole("button", { name: `View image ${String(count)}` }));
    expect(viewer.getByText(`${String(count)} / ${String(count)}`)).toBeVisible();
    fireEvent.click(viewer.getByRole("button", { name: "Next image" }));
    expect(viewer.getByText(`1 / ${String(count)}`)).toBeVisible();
    fireEvent.click(viewer.getByRole("button", { name: "Previous image" }));
    expect(viewer.getByText(`${String(count)} / ${String(count)}`)).toBeVisible();
    fireEvent.click(viewer.getByRole("button", { name: "Close full screen" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(`1280 × 720 · image-${String(count)}.jpg`)).toBeVisible();
    expect(document.body.style.overflow).toBe("");
  });
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

  it("offers every image of the version as one ZIP", () => {
    render(<PortfolioGallery portfolio={PORTFOLIO_TEST_DATA} />);

    expect(screen.getByRole("button", { name: "Download all (ZIP)" })).toBeEnabled();
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
