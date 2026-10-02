import { MarketingCarStage } from "./marketing-car-stage";
import {
  MARKETING_BACKGROUNDS_ID,
  MARKETING_CAR_GALLERY_MAIN_SIZES,
  MARKETING_CAR_GALLERY_SMALL_SIZES,
  MARKETING_COPY,
  MARKETING_STUDIO_BENEFITS,
} from "./marketing.constants";

export function MarketingStudioBackgrounds() {
  return (
    <section className="marketing-backgrounds" id={MARKETING_BACKGROUNDS_ID}>
      <div className="marketing-backgrounds__copy">
        <p className="eyebrow">{MARKETING_COPY.backgrounds.eyebrow}</p>
        <h2>{MARKETING_COPY.backgrounds.title}</h2>
        <p>{MARKETING_COPY.backgrounds.body}</p>
        <ul>
          {MARKETING_STUDIO_BENEFITS.map((benefit) => (
            <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>
          ))}
        </ul>
      </div>
      <div className="marketing-backgrounds__gallery">
        <MarketingCarStage label="Premium White" sizes={MARKETING_CAR_GALLERY_MAIN_SIZES} treatment="premium" />
        <MarketingCarStage label="Dark Studio" sizes={MARKETING_CAR_GALLERY_SMALL_SIZES} treatment="dark" />
        <MarketingCarStage label="Grey Studio" sizes={MARKETING_CAR_GALLERY_SMALL_SIZES} treatment="grey" />
      </div>
    </section>
  );
}
