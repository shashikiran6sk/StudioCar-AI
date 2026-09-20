import Image from "next/image";

import {
  MARKETING_CAR_IMAGE_ALT,
  MARKETING_CAR_IMAGE_PATH,
} from "./marketing.constants";

export type MarketingCarTreatment = "original" | "premium" | "dark" | "grey";

export interface MarketingCarStageProps {
  label?: string;
  priority?: boolean;
  treatment: MarketingCarTreatment;
}

export function MarketingCarStage({
  label,
  priority = false,
  treatment,
}: MarketingCarStageProps) {
  return (
    <div className={`marketing-car-stage marketing-car-stage--${treatment}`}>
      <Image
        alt={MARKETING_CAR_IMAGE_ALT}
        fill
        priority={priority}
        sizes="(max-width: 899px) 100vw, 60vw"
        src={MARKETING_CAR_IMAGE_PATH}
      />
      {label ? <span className="marketing-car-stage__label">{label}</span> : null}
    </div>
  );
}
