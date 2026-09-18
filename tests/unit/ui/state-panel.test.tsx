import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../../../packages/ui/src/button";
import { StatePanel } from "../../../packages/ui/src/state-panel";

describe("StatePanel", () => {
  it("pairs recovery copy with an explicit action", () => {
    render(
      <StatePanel
        action={<Button>Upload vehicle</Button>}
        description="Upload your first vehicle to create professional studio images."
        icon="+"
        title="Your inventory is empty"
      />,
    );

    expect(screen.getByRole("heading", { name: "Your inventory is empty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload vehicle" })).toBeInTheDocument();
  });
});

