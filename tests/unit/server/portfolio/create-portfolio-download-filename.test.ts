import { describe, expect, it } from "vitest";

import { createPortfolioDownloadFilename } from "../../../../apps/web/src/server/portfolio/create-portfolio-download-filename";

describe("createPortfolioDownloadFilename", () => {
  it("creates stable one-based filenames from trusted output MIME types", () => {
    expect(createPortfolioDownloadFilename(0, "image/webp")).toBe("processed-01.webp");
    expect(createPortfolioDownloadFilename(11, "image/jpeg")).toBe("processed-12.jpg");
    expect(createPortfolioDownloadFilename(1, "unknown/type")).toBe("processed-02.bin");
  });
});
