import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingAudienceStrip } from "../../../../apps/web/src/features/marketing/marketing-audience-strip";

describe("MarketingAudienceStrip", () => {
  it("names the four intended automotive audiences", () => {
    render(<MarketingAudienceStrip />);
    expect(screen.getByRole("list", { name: "Built for automotive teams" }))
      .toBeVisible();
    expect(screen.getByText("For marketplaces")).toBeVisible();
  });
});
