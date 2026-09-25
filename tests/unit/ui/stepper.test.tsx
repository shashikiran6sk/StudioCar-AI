import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stepper } from "../../../packages/ui/src/stepper";

describe("Stepper", () => {
  it("announces the current wizard position", () => {
    render(<Stepper current={2} total={4} />);
    expect(screen.getByRole("img", { name: "Step 2 of 4" })).toBeInTheDocument();
  });

  it("shows the labels for the vehicle creation stages", () => {
    render(<Stepper current={1} labels={["Vehicle", "Photos", "Studio", "Review"]} total={4} />);
    expect(screen.getByText("Vehicle")).toBeVisible();
    expect(screen.getByText("Photos")).toBeVisible();
    expect(screen.getByText("Studio")).toBeVisible();
    expect(screen.getByText("Review")).toBeVisible();
  });
});
