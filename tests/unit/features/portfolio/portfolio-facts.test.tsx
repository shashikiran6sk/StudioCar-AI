import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioFacts } from "../../../../apps/web/src/features/portfolio/portfolio-facts";
import { PORTFOLIO_OPTIONS } from "./portfolio-test-data";

describe("PortfolioFacts", () => {
  it("shows normalized treatment facts and original retention", () => {
    render(<PortfolioFacts options={PORTFOLIO_OPTIONS} />);

    expect(screen.getByText("Premium White")).toBeVisible();
    expect(screen.getByText("Standard floor")).toBeVisible();
    expect(screen.getByText("Originals preserved")).toBeVisible();
    expect(screen.getAllByText("Enabled")).toHaveLength(2);
  });
});
