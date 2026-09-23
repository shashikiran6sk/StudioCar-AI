import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PortfolioAttentionPanel } from "../../../../apps/web/src/features/portfolio/portfolio-attention-panel";
import { ATTENTION_TEST_DATA, PORTFOLIO_TEST_DATA } from "./portfolio-test-data";

describe("PortfolioAttentionPanel", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("names each failed image with a reason a person can act on", () => {
    render(
      <PortfolioAttentionPanel
        attention={ATTENTION_TEST_DATA}
        vehicleId={PORTFOLIO_TEST_DATA.id}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Needs your attention" }),
    ).toBeVisible();
    expect(screen.getByText("2 of 4 images need attention")).toBeVisible();
    expect(screen.getByText("Treatment used: Dark Studio · Plain background")).toBeVisible();
    expect(screen.getByText(/Image 3/)).toBeVisible();
    expect(screen.getByText(/Background removal was unavailable/)).toBeVisible();
    expect(screen.getByText(/Image 4/)).toBeVisible();
    expect(screen.getByText(/couldn't be read/)).toBeVisible();
    expect(screen.queryByText(/PROVIDER_|INVALID_IMAGE/)).not.toBeInTheDocument();
  });

  it("opens the Selection Dialog for Re-process and for Replace", () => {
    render(
      <PortfolioAttentionPanel
        attention={ATTENTION_TEST_DATA}
        vehicleId={PORTFOLIO_TEST_DATA.id}
      />,
    );

    expect(screen.getByRole("link", { name: "Re-process" })).toHaveAttribute(
      "href",
      `/inventory/${PORTFOLIO_TEST_DATA.id}?studio=REPROCESS_FAILED`,
    );
    expect(screen.getByRole("link", { name: "Replace" })).toHaveAttribute(
      "href",
      `/inventory/${PORTFOLIO_TEST_DATA.id}?studio=REPLACE_FAILED`,
    );
  });

  it("takes focus when the page was opened to review issues", () => {
    window.history.replaceState(null, "", "/inventory/vehicle#attention");

    render(
      <PortfolioAttentionPanel
        attention={ATTENTION_TEST_DATA}
        vehicleId={PORTFOLIO_TEST_DATA.id}
      />,
    );

    expect(screen.getByRole("region", { name: "Needs your attention" })).toHaveFocus();
  });

  it("leaves focus alone on an ordinary visit", () => {
    render(
      <PortfolioAttentionPanel
        attention={ATTENTION_TEST_DATA}
        vehicleId={PORTFOLIO_TEST_DATA.id}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Needs your attention" }),
    ).not.toHaveFocus();
  });
});
