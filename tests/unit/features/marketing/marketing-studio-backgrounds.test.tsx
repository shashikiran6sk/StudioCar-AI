import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingStudioBackgrounds } from "../../../../apps/web/src/features/marketing/marketing-studio-backgrounds";

describe("MarketingStudioBackgrounds", () => {
  it("presents consistent studio treatments using the same vehicle", () => {
    render(<MarketingStudioBackgrounds />);

    expect(screen.getAllByRole("img", { name: /Silver sedan on a .* Studio background|Silver sedan on a Premium White studio background/ }))
      .toHaveLength(3);
    expect(screen.getByRole("img", { name: "Silver sedan on a Premium White studio background" }))
      .toHaveAttribute("sizes", "(max-width: 899px) 100vw, 34vw");
    expect(screen.getByText("Dark Studio")).toBeVisible();
    expect(screen.getByText("Grey Studio")).toBeVisible();
  });
});
