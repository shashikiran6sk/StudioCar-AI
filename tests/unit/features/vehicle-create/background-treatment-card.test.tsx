import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BackgroundTreatmentCard } from "../../../../apps/web/src/features/vehicle-create/background-treatment-card";

describe("BackgroundTreatmentCard", () => {
  it("exposes selection state and selects its normalized value", () => {
    const onSelect = vi.fn();
    render(
      <BackgroundTreatmentCard
        choice={{
          label: "Dark Studio",
          value: "DARK_STUDIO",
          visualClassName: "background-treatment-card__visual--dark",
        }}
        onSelect={onSelect}
        selected={false}
      />,
    );

    const option = screen.getByRole("button", { name: "Dark Studio" });
    expect(option).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith("DARK_STUDIO");
  });
});
