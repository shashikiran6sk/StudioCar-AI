"use client";

import type { PortfolioAttention } from "@studiocar/contracts";
import { ButtonLink, StatusBadge } from "@studiocar/ui";
import { useEffect, useRef } from "react";

import { createPortfolioHref } from "./create-portfolio-href";
import { formatStudioTreatment } from "./format-studio-treatment";
import {
  PORTFOLIO_ATTENTION_ANCHOR,
  PORTFOLIO_ATTENTION_TITLE,
  PORTFOLIO_ATTENTION_TREATMENT_LABEL,
  PORTFOLIO_REPLACE_LABEL,
  PORTFOLIO_REPROCESS_LABEL,
} from "./portfolio.constants";
import { PortfolioFailedImageItem } from "./portfolio-failed-image-item";
import { formatAttentionCount } from "./format-attention-count";

const HEADING_ID = "portfolio-attention-heading";

export interface PortfolioAttentionPanelProps {
  attention: PortfolioAttention;
  vehicleId: string;
}

/**
 * The failed images of the vehicle's newest batch, with the two recoveries:
 * Re-process and Replace. Both open the Selection Dialog on this batch.
 */
export function PortfolioAttentionPanel({
  attention,
  vehicleId,
}: PortfolioAttentionPanelProps) {
  const panel = useRef<HTMLElement>(null);

  // Arriving from "Review issues" lands keyboard and screen-reader focus here.
  useEffect(() => {
    if (window.location.hash === `#${PORTFOLIO_ATTENTION_ANCHOR}`) {
      panel.current?.focus();
    }
  }, []);

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="portfolio-attention"
      id={PORTFOLIO_ATTENTION_ANCHOR}
      ref={panel}
      tabIndex={-1}
    >
      <div className="portfolio-attention__heading">
        <div>
          <h2 id={HEADING_ID}>{PORTFOLIO_ATTENTION_TITLE}</h2>
          <StatusBadge status="failed">
            {formatAttentionCount(attention.failedImages.length, attention.imageCount)}
          </StatusBadge>
        </div>
        <div className="portfolio-attention__actions">
          <ButtonLink
            href={createPortfolioHref(vehicleId, { studio: "REPROCESS_FAILED" })}
            size="small"
            variant="secondary"
          >
            {PORTFOLIO_REPROCESS_LABEL}
          </ButtonLink>
          <ButtonLink
            href={createPortfolioHref(vehicleId, { studio: "REPLACE_FAILED" })}
            size="small"
            variant="danger"
          >
            {PORTFOLIO_REPLACE_LABEL}
          </ButtonLink>
        </div>
      </div>
      <p className="portfolio-attention__treatment">
        {PORTFOLIO_ATTENTION_TREATMENT_LABEL}: {formatStudioTreatment(attention.options)}
      </p>
      <ul className="portfolio-attention__images">
        {attention.failedImages.map((image) => (
          <PortfolioFailedImageItem image={image} key={image.jobId} />
        ))}
      </ul>
    </section>
  );
}
