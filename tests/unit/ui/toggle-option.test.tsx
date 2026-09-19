import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToggleOption } from "../../../packages/ui/src/toggle-option";

describe("ToggleOption", () => {
  it("makes the full option row toggle the value", () => {
    const onCheckedChange = vi.fn();
    render(
      <ToggleOption
        checked={false}
        description="Automatically mask visible plates"
        label="Hide number plate"
        onCheckedChange={onCheckedChange}
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Hide number plate" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
