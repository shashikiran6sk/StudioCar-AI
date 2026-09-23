import type { PortfolioFailedImage } from "@studiocar/contracts";
import Image from "next/image";

import { PORTFOLIO_IMAGE_LABEL } from "./portfolio.constants";
import { PROCESSING_FAILURE_MESSAGES } from "../processing/processing-failure-messages.constants";

export interface PortfolioFailedImageItemProps {
  image: PortfolioFailedImage;
}

export function PortfolioFailedImageItem({ image }: PortfolioFailedImageItemProps) {
  return (
    <li className="portfolio-failed-image">
      <span className="portfolio-failed-image__media">
        <Image
          alt={`${PORTFOLIO_IMAGE_LABEL} ${String(image.displayOrder + 1)} original`}
          fill
          sizes="96px"
          src={image.originalUrl}
          unoptimized
        />
      </span>
      <span className="portfolio-failed-image__copy">
        <strong>
          {PORTFOLIO_IMAGE_LABEL} {image.displayOrder + 1}
          <span title={image.originalFilename}> · {image.originalFilename}</span>
        </strong>
        <span>{PROCESSING_FAILURE_MESSAGES[image.reason]}</span>
      </span>
    </li>
  );
}
