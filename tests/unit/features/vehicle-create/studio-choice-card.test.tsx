import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudioChoiceCard } from "../../../../apps/web/src/features/vehicle-create/studio-choice-card";

describe("StudioChoiceCard", () => {
  it("is named by its label and reports a selection", () => {
    const onSelect = vi.fn();
    render(
      <StudioChoiceCard
        label="Graphite Turntable"
        onSelect={onSelect}
        previewPath="/studio-assets/floors/dark-turntable.webp"
        selected={false}
        variant="floor"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Graphite Turntable" }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("says whether it is chosen, without relying on colour alone", () => {
    render(
      <StudioChoiceCard
        label="Dark Studio"
        onSelect={vi.fn()}
        previewPath="/studio-assets/backgrounds/dark-studio.webp"
        selected
        variant="background"
      />,
    );

    const card = screen.getByRole("button", { name: "Dark Studio" });
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveTextContent("✓");
  });

  it("can be disabled", () => {
    render(
      <StudioChoiceCard
        disabled
        label="Grey Studio"
        onSelect={vi.fn()}
        previewPath="/studio-assets/backgrounds/grey-studio.webp"
        selected={false}
        variant="background"
      />,
    );

    expect(screen.getByRole("button", { name: "Grey Studio" })).toBeDisabled();
  });
});
