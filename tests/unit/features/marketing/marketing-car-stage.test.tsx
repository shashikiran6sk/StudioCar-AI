import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingCarStage } from "../../../../apps/web/src/features/marketing/marketing-car-stage";

describe("MarketingCarStage", () => {
  it("reuses the owned vehicle asset inside a named treatment", () => {
    const { container } = render(
      <MarketingCarStage label="Premium White" treatment="premium" />,
    );

    expect(screen.getByRole("img", { name: "Silver sedan on a Premium White studio background" }))
      .toHaveAttribute("src", expect.stringContaining("silver-sedan.png"));
    expect(screen.getByText("Premium White")).toBeVisible();
    expect(container.firstChild).toHaveClass("marketing-car-stage--premium");
  });
});
