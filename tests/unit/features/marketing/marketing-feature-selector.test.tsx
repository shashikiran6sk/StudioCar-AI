import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFeatureSelector } from "../../../../apps/web/src/features/marketing/marketing-feature-selector";

describe("MarketingFeatureSelector", () => {
  it("supports keyboard-native feature selection", () => {
    render(<MarketingFeatureSelector />);

    const studio = screen.getByRole("button", { name: /Studio backgrounds/ });
    const shadows = screen.getByRole("button", { name: /Natural shadows/ });
    expect(studio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(shadows);
    expect(shadows).toHaveAttribute("aria-pressed", "true");
    expect(studio).toHaveAttribute("aria-pressed", "false");
  });

  it("advertises no number-plate masking", () => {
    render(<MarketingFeatureSelector />);

    expect(screen.queryByRole("button", { name: /Plate privacy/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/number plate/i);
  });
});
