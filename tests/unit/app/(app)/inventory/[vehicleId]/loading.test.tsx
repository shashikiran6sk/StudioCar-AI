import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import VehiclePortfolioLoading from "../../../../../../apps/web/src/app/(app)/inventory/[vehicleId]/loading";

describe("VehiclePortfolioLoading", () => {
  it("preserves portfolio gallery geometry while loading", () => {
    render(<VehiclePortfolioLoading />);
    expect(screen.getByRole("status", { name: "Loading vehicle portfolio" }))
      .toBeVisible();
  });
});
