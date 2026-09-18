import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "../../../packages/ui/src/skeleton";

describe("Skeleton", () => {
  it("provides a concise loading announcement", () => {
    render(<Skeleton label="Loading vehicle cards" />);
    expect(screen.getByRole("status", { name: "Loading vehicle cards" })).toBeInTheDocument();
  });
});

