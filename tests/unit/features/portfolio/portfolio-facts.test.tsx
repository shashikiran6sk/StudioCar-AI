import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioFacts } from "../../../../apps/web/src/features/portfolio/portfolio-facts";
import { PORTFOLIO_OPTIONS } from "./portfolio-test-data";

describe("PortfolioFacts", () => {
  it("shows normalized treatment facts and original retention", () => {
    render(<PortfolioFacts version={{ label: null, options: PORTFOLIO_OPTIONS }} />);

    expect(screen.getByText("Premium White")).toBeVisible();
    expect(screen.getByText("Standard floor")).toBeVisible();
    expect(screen.getByText("Originals preserved")).toBeVisible();
    expect(screen.getAllByText("Enabled")).toHaveLength(1);
  });

  it("no longer lists number-plate masking or a shadow choice", () => {
    render(<PortfolioFacts version={{ label: null, options: PORTFOLIO_OPTIONS }} />);

    expect(screen.queryByText("Plate privacy")).not.toBeInTheDocument();
    expect(screen.queryByText("Shadow")).not.toBeInTheDocument();
  });

  it("names the composition and shows a version's label beside its facts", () => {
    render(
      <PortfolioFacts
        version={{
          label: "T03-S05 | Enhance ON | Studio ON | Composition OFF",
          options: { ...PORTFOLIO_OPTIONS, crop: "FIT_VEHICLE" },
        }}
      />,
    );

    expect(screen.getByText("Reference label")).toBeVisible();
    expect(
      screen.getByText("T03-S05 | Enhance ON | Studio ON | Composition OFF"),
    ).toBeVisible();
    expect(screen.getByText("Fit to vehicle")).toBeVisible();
  });

  it("shows no label row for an unlabelled version", () => {
    render(<PortfolioFacts version={{ label: null, options: PORTFOLIO_OPTIONS }} />);

    expect(screen.queryByText("Reference label")).not.toBeInTheDocument();
    expect(screen.getByText("Maintained")).toBeVisible();
  });
});
