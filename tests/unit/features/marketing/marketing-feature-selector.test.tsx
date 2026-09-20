import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFeatureSelector } from "../../../../apps/web/src/features/marketing/marketing-feature-selector";

describe("MarketingFeatureSelector", () => {
  it("supports keyboard-native feature selection", () => {
    render(<MarketingFeatureSelector />);

    const studio = screen.getByRole("button", { name: /Studio backgrounds/ });
    const privacy = screen.getByRole("button", { name: /Plate privacy/ });
    expect(studio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(privacy);
    expect(privacy).toHaveAttribute("aria-pressed", "true");
    expect(studio).toHaveAttribute("aria-pressed", "false");
  });
});
