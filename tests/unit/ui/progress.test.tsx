import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "../../../packages/ui/src/progress";

describe("Progress", () => {
  it("exposes real determinate values", () => {
    render(<Progress label="Uploading" value={65} valueLabel="65%" />);
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toHaveAttribute(
      "aria-valuenow",
      "65",
    );
  });

  it("does not fabricate a percentage for pending work", () => {
    render(<Progress label="Queued" />);
    expect(screen.getByRole("progressbar", { name: "Queued" })).not.toHaveAttribute(
      "aria-valuenow",
    );
  });
});

