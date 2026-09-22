import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PlanLimitsProvider,
  usePlanLimits,
} from "../../../../apps/web/src/features/shell/plan-limits-context";

function Limits() {
  const { maxImagesPerBatch } = usePlanLimits();
  return <span>{maxImagesPerBatch}</span>;
}

describe("usePlanLimits", () => {
  it("reports the limits the server resolved for this tenant", () => {
    render(
      <PlanLimitsProvider limits={{ maxImagesPerBatch: 20 }}>
        <Limits />
      </PlanLimitsProvider>,
    );

    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("falls back to the smallest allowance outside a provider", () => {
    render(<Limits />);

    // A failure to resolve must never let someone start work the server refuses.
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
