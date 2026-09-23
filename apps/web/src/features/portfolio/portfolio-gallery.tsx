"use client";

import type { VehiclePortfolio } from "@studiocar/contracts";
import { Button, ButtonLink, ComparisonSlider } from "@studiocar/ui";
import Image from "next/image";
import { useState } from "react";

import {
  PORTFOLIO_CLOSE_VIEWER_LABEL,
  PORTFOLIO_COMPARE_LABEL,
  PORTFOLIO_DOWNLOAD_LABEL,
  PORTFOLIO_ESCAPE_KEY,
  PORTFOLIO_FULLSCREEN_LABEL,
  PORTFOLIO_NEXT_LABEL,
  PORTFOLIO_PREVIOUS_LABEL,
} from "./portfolio.constants";

export interface PortfolioGalleryProps {
  portfolio: VehiclePortfolio;
}

export function PortfolioGallery({ portfolio }: PortfolioGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const selected = portfolio.images[selectedIndex] ?? portfolio.images[0];
  if (!selected) return null;

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? portfolio.images.length - 1 : current - 1,
    );
  };
  const showNext = () => {
    setSelectedIndex((current) => (current + 1) % portfolio.images.length);
  };

  const comparison = (
    <ComparisonSlider
      after={
        <Image
          alt={`${portfolio.name} processed`}
          fill
          priority
          sizes="(max-width: 899px) 100vw, 70vw"
          src={selected.processedUrl}
          unoptimized
        />
      }
      before={
        <Image
          alt={`${portfolio.name} original`}
          fill
          priority
          sizes="(max-width: 899px) 100vw, 70vw"
          src={selected.originalUrl}
          unoptimized
        />
      }
      label={PORTFOLIO_COMPARE_LABEL}
    />
  );

  return (
    <section aria-label={`${portfolio.name} image portfolio`} className="portfolio-gallery">
      <div className="portfolio-gallery__stage">{comparison}</div>
      <div aria-label="Portfolio images" className="portfolio-gallery__thumbnails">
        {portfolio.images.map((image, index) => (
          <button
            aria-label={`View image ${String(index + 1)}`}
            aria-pressed={index === selectedIndex}
            className="portfolio-gallery__thumbnail"
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            <Image
              alt=""
              fill
              sizes="160px"
              src={image.previewUrl}
              unoptimized
            />
          </button>
        ))}
      </div>
      <footer className="portfolio-gallery__footer">
        <span>
          {selected.width} × {selected.height} · {selected.originalFilename}
        </span>
        <div>
          <Button onClick={() => setViewerOpen(true)} variant="secondary">
            {PORTFOLIO_FULLSCREEN_LABEL}
          </Button>
          <ButtonLink download href={selected.downloadUrl} variant="primary">
            {PORTFOLIO_DOWNLOAD_LABEL}
          </ButtonLink>
        </div>
      </footer>
      {viewerOpen ? (
        <dialog
          aria-label={`${portfolio.name} full screen viewer`}
          className="portfolio-viewer"
          onKeyDown={(event) => {
            if (event.key === PORTFOLIO_ESCAPE_KEY) setViewerOpen(false);
          }}
          open
        >
          <div className="portfolio-viewer__topbar">
            <span>
              {selectedIndex + 1} / {portfolio.images.length}
            </span>
            <Button
              autoFocus
              className="portfolio-viewer__close"
              onClick={() => setViewerOpen(false)}
              variant="ghost"
            >
              <span aria-hidden="true">×</span> {PORTFOLIO_CLOSE_VIEWER_LABEL}
            </Button>
          </div>
          <div className="portfolio-viewer__image">{comparison}</div>
          <div className="portfolio-viewer__navigation">
            <Button aria-label={PORTFOLIO_PREVIOUS_LABEL} onClick={showPrevious} size="icon">
              ←
            </Button>
            <ButtonLink download href={selected.downloadUrl} variant="primary">
              {PORTFOLIO_DOWNLOAD_LABEL}
            </ButtonLink>
            <Button aria-label={PORTFOLIO_NEXT_LABEL} onClick={showNext} size="icon">
              →
            </Button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
