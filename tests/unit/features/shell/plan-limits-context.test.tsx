import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FALLBACK_PLAN_LIMITS,
  PlanLimitsProvider,
  usePlanLimits,
} from "../../../../apps/web/src/features/shell/plan-limits-context";
import { FREE_PLAN_DEFAULT } from "../../../../apps/web/src/server/plans/default-plan-configurations";

function Limits() {
  const { largestAvailableBatch, maxImagesPerBatch, planName } =
    usePlanLimits();
  return (
    <span>{`${planName}:${String(maxImagesPerBatch)}:${String(largestAvailableBatch)}`}</span>
  );
}

describe("usePlanLimits", () => {
  it("reports the limits the server resolved for this tenant", () => {
    render(
      <PlanLimitsProvider
        limits={{
          largestAvailableBatch: 20,
          maxImagesPerBatch: 20,
          planName: "Studio Pro",
        }}
      >
        <Limits />
      </PlanLimitsProvider>,
    );

    expect(screen.getByText("Studio Pro:20:20")).toBeInTheDocument();
  });

  it("falls back to the smallest allowance outside a provider", () => {
    render(<Limits />);

    // A failure to resolve must never let someone start work the server refuses.
    expect(screen.getByText("Free:5:null")).toBeInTheDocument();
  });

  it("takes its fallback from the canonical free plan, not a second copy", () => {
    expect(FALLBACK_PLAN_LIMITS.maxImagesPerBatch).toBe(
      FREE_PLAN_DEFAULT.maxImagesPerBatch,
    );
    expect(FALLBACK_PLAN_LIMITS.planName).toBe(FREE_PLAN_DEFAULT.displayName);
  });
});
