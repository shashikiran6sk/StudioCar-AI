import { PORTFOLIO_DOWNLOAD_PREFIX, PORTFOLIO_MIME_EXTENSIONS } from "./portfolio.constants";

export function createPortfolioDownloadFilename(
  displayOrder: number,
  mimeType: string,
): string {
  const extension = PORTFOLIO_MIME_EXTENSIONS[mimeType] ?? "bin";
  return `${PORTFOLIO_DOWNLOAD_PREFIX}-${String(displayOrder + 1).padStart(2, "0")}.${extension}`;
}
