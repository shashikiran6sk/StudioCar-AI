"use client";

import type { VehiclePortfolio } from "@studiocar/contracts";
import { Button, ButtonLink, ComparisonSlider } from "@studiocar/ui";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { createPortfolioZipFilename } from "./create-portfolio-zip-filename";
import {
  PORTFOLIO_CLOSE_VIEWER_LABEL,
  PORTFOLIO_COMPARE_LABEL,
  PORTFOLIO_DOWNLOAD_LABEL,
  PORTFOLIO_ESCAPE_KEY,
  PORTFOLIO_FULLSCREEN_LABEL,
  PORTFOLIO_IMAGES_LABEL,
  PORTFOLIO_NEXT_LABEL,
  PORTFOLIO_PREVIOUS_LABEL,
  PORTFOLIO_TAB_KEY,
  PORTFOLIO_THUMBNAIL_LIMIT,
  PORTFOLIO_VIEW_ALL_LABEL,
  PORTFOLIO_VIEWER_IMAGES_LABEL,
} from "./portfolio.constants";
import { PortfolioThumbnail } from "./portfolio-thumbnail";
import { PortfolioZipDownloadButton } from "./portfolio-zip-download-button";
import { selectPortfolioVersion } from "./select-portfolio-version";

export interface PortfolioGalleryProps {
  portfolio: VehiclePortfolio;
}

export function PortfolioGallery({ portfolio }: PortfolioGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const viewerTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerOpen || !viewer) return;
    const overflow = document.body.style.overflow;
    viewer.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      viewer.close();
      document.body.style.overflow = overflow;
      if (viewerTriggerRef.current?.isConnected) viewerTriggerRef.current.focus();
    };
  }, [viewerOpen]);
  const selected = portfolio.images[selectedIndex] ?? portfolio.images[0];
  if (!selected) return null;
  const hasOverflow = portfolio.images.length > PORTFOLIO_THUMBNAIL_LIMIT;
  const visibleImages = hasOverflow
    ? portfolio.images.slice(0, PORTFOLIO_THUMBNAIL_LIMIT - 1)
    : portfolio.images;
  const remainingCount = portfolio.images.length - visibleImages.length;

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
      <div aria-label={PORTFOLIO_IMAGES_LABEL} className="portfolio-gallery__thumbnails">
        {visibleImages.map((image, index) => (
          <PortfolioThumbnail
            image={image}
            index={index}
            key={image.id}
            onSelect={setSelectedIndex}
            selectedIndex={selectedIndex}
          />
        ))}
        {hasOverflow ? (
          <button
            aria-label={`${PORTFOLIO_VIEW_ALL_LABEL} ${String(portfolio.images.length)} images`}
            className="portfolio-gallery__thumbnail portfolio-gallery__overflow"
            onClick={(event) => {
              viewerTriggerRef.current = event.currentTarget;
              setSelectedIndex(visibleImages.length);
              setViewerOpen(true);
            }}
            type="button"
          >
            <strong>+{remainingCount}</strong>
            <span>{PORTFOLIO_VIEW_ALL_LABEL}</span>
          </button>
        ) : null}
      </div>
      <footer className="portfolio-gallery__footer">
        <span>
          {selected.width} × {selected.height} · {selected.originalFilename}
        </span>
        <div>
          <Button onClick={(event) => {
            viewerTriggerRef.current = event.currentTarget;
            setViewerOpen(true);
          }} variant="secondary">
            {PORTFOLIO_FULLSCREEN_LABEL}
          </Button>
          <PortfolioZipDownloadButton
            images={portfolio.images}
            zipFilename={createPortfolioZipFilename(
              portfolio.name,
              selectPortfolioVersion(portfolio)?.label ?? null,
            )}
          />
          <ButtonLink download href={selected.downloadUrl} variant="primary">
            {PORTFOLIO_DOWNLOAD_LABEL}
          </ButtonLink>
        </div>
      </footer>
      {viewerOpen ? (
        <dialog
          aria-label={`${portfolio.name} full screen viewer`}
          className="portfolio-viewer"
          onCancel={() => setViewerOpen(false)}
          onKeyDown={(event) => {
            if (event.key === PORTFOLIO_ESCAPE_KEY) setViewerOpen(false);
          }}
          ref={viewerRef}
        >
          <div className="portfolio-viewer__topbar">
            <span>
              {selectedIndex + 1} / {portfolio.images.length}
            </span>
            <Button
              className="portfolio-viewer__close"
              onClick={() => setViewerOpen(false)}
              onKeyDown={(event) => {
                if (event.key === PORTFOLIO_TAB_KEY && event.shiftKey) {
                  event.preventDefault();
                  nextButtonRef.current?.focus();
                }
              }}
              ref={closeButtonRef}
              variant="ghost"
            >
              <span aria-hidden="true">×</span> {PORTFOLIO_CLOSE_VIEWER_LABEL}
            </Button>
          </div>
          <div className="portfolio-viewer__image">{comparison}</div>
          <div aria-label={PORTFOLIO_VIEWER_IMAGES_LABEL} className="portfolio-viewer__thumbnails">
            {portfolio.images.map((image, index) => (
              <PortfolioThumbnail
                image={image}
                index={index}
                key={image.id}
                onSelect={setSelectedIndex}
                selectedIndex={selectedIndex}
              />
            ))}
          </div>
          <div className="portfolio-viewer__navigation">
            <Button aria-label={PORTFOLIO_PREVIOUS_LABEL} onClick={showPrevious} size="icon">
              ←
            </Button>
            <ButtonLink download href={selected.downloadUrl} variant="primary">
              {PORTFOLIO_DOWNLOAD_LABEL}
            </ButtonLink>
            <Button
              aria-label={PORTFOLIO_NEXT_LABEL}
              onClick={showNext}
              onKeyDown={(event) => {
                if (event.key === PORTFOLIO_TAB_KEY && !event.shiftKey) {
                  event.preventDefault();
                  closeButtonRef.current?.focus();
                }
              }}
              ref={nextButtonRef}
              size="icon"
            >
              →
            </Button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
