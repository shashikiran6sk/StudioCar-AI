import type { PortfolioImage } from "@studiocar/contracts";

import { buildPortfolioZip } from "./build-portfolio-zip";
import { fetchPortfolioImage } from "./fetch-portfolio-image";
import { mapWithConcurrency } from "./map-with-concurrency";
import {
  PORTFOLIO_ZIP_FETCH_CONCURRENCY,
  PORTFOLIO_ZIP_MIME_TYPE,
} from "./portfolio.constants";
import { saveFile } from "./save-file";

export interface DownloadPortfolioZipDependencies {
  fetchImage?: (url: string) => Promise<Uint8Array>;
  /** Called after each image arrives, with how many have arrived so far. */
  onProgress?: (fetched: number) => void;
  save?: (bytes: Uint8Array, filename: string, mimeType: string) => void;
}

/**
 * Collects every image of a studio version into one ZIP in the browser and
 * saves it. Progress counts images actually received, never an estimate.
 */
export async function downloadPortfolioZip(
  images: readonly Pick<PortfolioImage, "downloadFilename" | "downloadUrl">[],
  zipFilename: string,
  {
    fetchImage = fetchPortfolioImage,
    onProgress,
    save = saveFile,
  }: DownloadPortfolioZipDependencies = {},
): Promise<void> {
  let fetched = 0;
  const entries = await mapWithConcurrency(
    images,
    PORTFOLIO_ZIP_FETCH_CONCURRENCY,
    async (image) => {
      const bytes = await fetchImage(image.downloadUrl);
      fetched += 1;
      onProgress?.(fetched);
      return { bytes, filename: image.downloadFilename };
    },
  );
  save(buildPortfolioZip(entries), zipFilename, PORTFOLIO_ZIP_MIME_TYPE);
}
