"use client";

import type { PortfolioImage } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";
import { useState } from "react";

import { downloadPortfolioZip } from "./download-portfolio-zip";
import { formatZipProgress } from "./format-zip-progress";
import {
  PORTFOLIO_ZIP_DOWNLOAD_LABEL,
  PORTFOLIO_ZIP_ERROR_MESSAGE,
} from "./portfolio.constants";

export interface PortfolioZipDownloadButtonProps {
  images: readonly Pick<PortfolioImage, "downloadFilename" | "downloadUrl">[];
  zipFilename: string;
}

type ZipState =
  | { kind: "idle" }
  | { kind: "preparing"; fetched: number }
  | { kind: "failed" };

/**
 * Saves every image of the studio version on show as one ZIP. The archive is
 * built in the browser from the same signed links as the single downloads.
 */
export function PortfolioZipDownloadButton({
  images,
  zipFilename,
}: PortfolioZipDownloadButtonProps) {
  const [state, setState] = useState<ZipState>({ kind: "idle" });
  const progress =
    state.kind === "preparing"
      ? formatZipProgress(state.fetched, images.length)
      : null;

  async function download(): Promise<void> {
    setState({ kind: "preparing", fetched: 0 });
    try {
      await downloadPortfolioZip(images, zipFilename, {
        onProgress: (fetched) => setState({ kind: "preparing", fetched }),
      });
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "failed" });
    }
  }

  return (
    <div className="portfolio-zip-download">
      <Button
        aria-busy={state.kind === "preparing"}
        disabled={state.kind === "preparing" || images.length === 0}
        onClick={() => void download()}
        variant="secondary"
      >
        {progress ?? PORTFOLIO_ZIP_DOWNLOAD_LABEL}
      </Button>
      <p aria-live="polite" className="sc-visually-hidden">
        {progress ?? ""}
      </p>
      {state.kind === "failed" ? (
        <p className="portfolio-zip-download__error" role="alert">
          {PORTFOLIO_ZIP_ERROR_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
