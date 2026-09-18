import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "../../../packages/ui/src/input";

describe("Field", () => {
  it("associates an error with the invalid input", () => {
    render(<Field error="Vehicle name is required" label="Vehicle name" required />);

    const input = screen.getByRole("textbox", { name: /Vehicle name/ });
    const error = screen.getByText("Vehicle name is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });
});

