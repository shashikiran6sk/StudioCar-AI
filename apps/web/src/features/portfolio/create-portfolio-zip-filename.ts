import {
  PORTFOLIO_ZIP_EXTENSION,
  PORTFOLIO_ZIP_FALLBACK_NAME,
  PORTFOLIO_ZIP_FILENAME_SUFFIX,
} from "./portfolio.constants";

/**
 * `2022 BMW 3 Series` becomes `2022-bmw-3-series-studio-images.zip`. A version's
 * reference label is added, so two versions of one vehicle save apart.
 */
export function createPortfolioZipFilename(
  vehicleName: string,
  versionLabel: string | null,
): string {
  const parts = [vehicleName, versionLabel ?? ""]
    .map((part) =>
      part
        .normalize("NFKD")
        .replace(/\p{Mark}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter((part) => part.length > 0);
  const stem = parts.length > 0 ? parts.join("-") : PORTFOLIO_ZIP_FALLBACK_NAME;
  return `${stem}-${PORTFOLIO_ZIP_FILENAME_SUFFIX}.${PORTFOLIO_ZIP_EXTENSION}`;
}
