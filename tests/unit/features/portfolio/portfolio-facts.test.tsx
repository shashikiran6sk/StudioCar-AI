import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioFacts } from "../../../../apps/web/src/features/portfolio/portfolio-facts";
import { PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioFacts", () => {
  it("shows normalized treatment facts and original retention", () => {
    render(<PortfolioFacts portfolio={PORTFOLIO_TEST_DATA} />);

    expect(screen.getByText("Premium White")).toBeVisible();
    expect(screen.getByText("Originals preserved")).toBeVisible();
    expect(screen.getAllByText("Enabled")).toHaveLength(2);
  });
});
