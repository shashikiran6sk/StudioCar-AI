import { describe, expect, it } from "vitest";

import { createPortfolioAttentionHref } from "../../../../apps/web/src/features/portfolio/create-portfolio-attention-href";

describe("createPortfolioAttentionHref", () => {
  it("opens the portfolio at its attention section", () => {
    expect(createPortfolioAttentionHref("4bb7fa89-c907-4458-9786-8aafc2235728")).toBe(
      "/inventory/4bb7fa89-c907-4458-9786-8aafc2235728#attention",
    );
  });
});
