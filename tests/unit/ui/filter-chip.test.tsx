import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FilterChip } from "../../../packages/ui/src/filter-chip";

describe("FilterChip", () => {
  it("announces its selected state", () => {
    render(<FilterChip active>Completed 19</FilterChip>);
    expect(screen.getByRole("button", { name: "Completed 19" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

