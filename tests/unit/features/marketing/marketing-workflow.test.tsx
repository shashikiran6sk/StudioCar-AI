import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingWorkflow } from "../../../../apps/web/src/features/marketing/marketing-workflow";

describe("MarketingWorkflow", () => {
  it("explains the four real product steps and asynchronous handoff", () => {
    render(<MarketingWorkflow />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: "Vehicle details" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Review & process" })).toBeVisible();
    expect(screen.getByText(/live processing card appears in Inventory/)).toBeVisible();
  });
});
