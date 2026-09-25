import Image from "next/image";

import {
  MARKETING_CAR_IMAGE_ALT,
  MARKETING_CAR_HERO_SIZES,
  MARKETING_CAR_IMAGE_PATH,
} from "./marketing.constants";

export type MarketingCarTreatment = "original" | "premium" | "dark" | "grey";

export interface MarketingCarStageProps {
  label?: string;
  priority?: boolean;
  sizes?: string;
  treatment: MarketingCarTreatment;
}

export function MarketingCarStage({
  label,
  priority = false,
  sizes = MARKETING_CAR_HERO_SIZES,
  treatment,
}: MarketingCarStageProps) {
  return (
    <div className={`marketing-car-stage marketing-car-stage--${treatment}`}>
      <Image
        alt={MARKETING_CAR_IMAGE_ALT[treatment]}
        fill
        priority={priority}
        sizes={sizes}
        src={MARKETING_CAR_IMAGE_PATH}
      />
      {label ? <span className="marketing-car-stage__label">{label}</span> : null}
    </div>
  );
}
