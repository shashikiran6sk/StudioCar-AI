import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextareaField } from "../../../packages/ui/src/textarea";

describe("TextareaField", () => {
  it("associates an accessible error with the textarea", () => {
    render(<TextareaField error="Notes are too long." label="Notes" />);

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Notes are too long.");
  });
});
