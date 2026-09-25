import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stepper } from "../../../packages/ui/src/stepper";

describe("Stepper", () => {
  it("announces the current wizard position", () => {
    render(<Stepper current={2} total={4} />);
    expect(screen.getByRole("img", { name: "Step 2 of 4" })).toBeInTheDocument();
  });
});
