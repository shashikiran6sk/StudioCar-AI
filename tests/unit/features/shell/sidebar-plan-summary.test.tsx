import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SidebarPlanSummary } from "../../../../apps/web/src/features/shell/sidebar-plan-summary";

const freePlan = {
  planKey: "FREE" as const,
  planName: "Free",
  imagesUsed: 8,
  imageCapacity: 15,
  maxImagesPerBatch: 5,
  storageUsedBytes: 1_288_490_188,
  storageCapacityBytes: 3_221_225_472,
};

describe("SidebarPlanSummary", () => {
  it("states the plan, the images used against the allowance, and storage", () => {
    render(<SidebarPlanSummary summary={freePlan} />);

    expect(screen.getByText("Free plan")).toBeInTheDocument();
    expect(screen.getByText("8 / 15 images used")).toBeInTheDocument();
    expect(screen.getByText(/of/)).toBeInTheDocument();
  });

  it("exposes the allowance as an accessible progress value", () => {
    render(<SidebarPlanSummary summary={freePlan} />);

    const progress = screen.getByRole("progressbar", {
      name: "8 / 15 images used",
    });
    expect(progress).toHaveAttribute("aria-valuenow", "8");
    expect(progress).toHaveAttribute("aria-valuemax", "15");
  });

  it("never reports more used than the allowance permits", () => {
    render(
      <SidebarPlanSummary summary={{ ...freePlan, imagesUsed: 31 }} />,
    );

    expect(
      screen.getByRole("progressbar", { name: "31 / 15 images used" }),
    ).toHaveAttribute("aria-valuenow", "15");
  });

  it("omits a storage allowance the plan does not define", () => {
    render(
      <SidebarPlanSummary
        summary={{ ...freePlan, storageCapacityBytes: null }}
      />,
    );

    expect(screen.getByText(/stored/)).toBeInTheDocument();
  });

  it("falls back to a truthful notice when usage is unavailable", () => {
    render(<SidebarPlanSummary summary={null} />);

    expect(screen.getByText("Your workspace")).toBeInTheDocument();
    expect(
      screen.getByText(/available from Packs & Billing/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
