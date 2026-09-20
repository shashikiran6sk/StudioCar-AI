import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingStudioBackgrounds } from "../../../../apps/web/src/features/marketing/marketing-studio-backgrounds";

describe("MarketingStudioBackgrounds", () => {
  it("presents consistent studio treatments using the same vehicle", () => {
    render(<MarketingStudioBackgrounds />);

    expect(screen.getAllByRole("img", { name: "Silver sedan in a studio treatment" }))
      .toHaveLength(3);
    expect(screen.getByText("Dark Studio")).toBeVisible();
    expect(screen.getByText("Grey Studio")).toBeVisible();
  });
});
