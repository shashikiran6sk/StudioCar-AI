import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../../../packages/ui/src/status-badge";

describe("StatusBadge", () => {
  it("includes visible text in addition to semantic color", () => {
    render(<StatusBadge status="completed">Completed</StatusBadge>);
    expect(screen.getByText("Completed")).toHaveClass("sc-status--completed");
  });
});

