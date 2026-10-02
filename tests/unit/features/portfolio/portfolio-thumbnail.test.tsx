import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { PortfolioThumbnail } from "../../../../apps/web/src/features/portfolio/portfolio-thumbnail";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

it("announces selection and selects the requested image", () => {
  const image = PORTFOLIO_TEST_DATA.images[0];
  if (!image) throw new Error("An image fixture is required.");
  const onSelect = vi.fn();
  render(<PortfolioThumbnail image={image} index={4} onSelect={onSelect} selectedIndex={4} />);
  const button = screen.getByRole("button", { name: "View image 5" });
  expect(button).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(button);
  expect(onSelect).toHaveBeenCalledWith(4);
});
