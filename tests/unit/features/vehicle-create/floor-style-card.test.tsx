import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FloorStyleCard } from "../../../../apps/web/src/features/vehicle-create/floor-style-card";
import { FLOOR_STYLE_CHOICES } from "../../../../apps/web/src/features/vehicle-create/floor-style.constants";

const plain = FLOOR_STYLE_CHOICES[0];

describe("FloorStyleCard", () => {
  it("offers its floor and reports the choice", () => {
    const onSelect = vi.fn();
    if (!plain) throw new Error("Expected the plain background choice.");
    render(<FloorStyleCard choice={plain} onSelect={onSelect} selected={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Plain background" }));

    expect(onSelect).toHaveBeenCalledWith("PLAIN");
  });

  it("says whether it is the chosen floor", () => {
    if (!plain) throw new Error("Expected the plain background choice.");
    render(<FloorStyleCard choice={plain} onSelect={vi.fn()} selected />);

    expect(screen.getByRole("button", { name: "Plain background" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
