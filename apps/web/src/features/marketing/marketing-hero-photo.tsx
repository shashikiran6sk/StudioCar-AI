import Image from "next/image";

import { MARKETING_CAR_HERO_SIZES } from "./marketing.constants";

export interface MarketingHeroPhotoProps {
  alt: string;
  src: string;
}

/**
 * One side of the hero comparison. Both sides are the same size with the car
 * in the same place, so dragging the slider changes only the background.
 */
export function MarketingHeroPhoto({ alt, src }: MarketingHeroPhotoProps) {
  return (
    <div className="marketing-hero-photo">
      <Image alt={alt} fill priority sizes={MARKETING_CAR_HERO_SIZES} src={src} />
    </div>
  );
}
