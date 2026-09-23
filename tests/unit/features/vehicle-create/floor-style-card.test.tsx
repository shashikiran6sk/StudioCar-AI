import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FloorStyleCard } from "../../../../apps/web/src/features/vehicle-create/floor-style-card";
import { FLOOR_STYLE_CHOICES } from "../../../../apps/web/src/features/vehicle-create/floor-style.constants";

const turntable = FLOOR_STYLE_CHOICES[1];

describe("FloorStyleCard", () => {
  it("offers its floor and reports the choice", () => {
    const onSelect = vi.fn();
    if (!turntable) throw new Error("Expected the turntable choice.");
    render(<FloorStyleCard choice={turntable} onSelect={onSelect} selected={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Turntable" }));

    expect(onSelect).toHaveBeenCalledWith("TURNTABLE");
  });

  it("says whether it is the chosen floor", () => {
    if (!turntable) throw new Error("Expected the turntable choice.");
    render(<FloorStyleCard choice={turntable} onSelect={vi.fn()} selected />);

    expect(screen.getByRole("button", { name: "Turntable" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
