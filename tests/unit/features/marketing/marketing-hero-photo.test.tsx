import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHeroPhoto } from "../../../../apps/web/src/features/marketing/marketing-hero-photo";

describe("MarketingHeroPhoto", () => {
  it("shows the described photograph, loaded eagerly above the fold", () => {
    render(
      <MarketingHeroPhoto
        alt="Silver sedan on a street"
        src="/images/marketing/hero-original.webp"
      />,
    );

    const photo = screen.getByRole("img", { name: "Silver sedan on a street" });
    expect(photo).toHaveAttribute("src", expect.stringContaining("hero-original.webp"));
    expect(photo).not.toHaveAttribute("loading", "lazy");
  });
});
