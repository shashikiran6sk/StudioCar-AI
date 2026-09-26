import type { PortfolioImage } from "@studiocar/contracts";
import Image from "next/image";

export interface PortfolioThumbnailProps {
  image: PortfolioImage;
  index: number;
  onSelect: (index: number) => void;
  selectedIndex: number;
}

export function PortfolioThumbnail({ image, index, onSelect, selectedIndex }: PortfolioThumbnailProps) {
  return (
    <button
      aria-label={`View image ${String(index + 1)}`}
      aria-pressed={index === selectedIndex}
      className="portfolio-gallery__thumbnail"
      onClick={() => onSelect(index)}
      type="button"
    >
      <Image alt="" fill sizes="160px" src={image.previewUrl} unoptimized />
    </button>
  );
}
