import { MARKETING_AUDIENCES, MARKETING_COPY } from "./marketing.constants";

export function MarketingAudienceStrip() {
  return (
    <ul aria-label={MARKETING_COPY.audienceLabel} className="marketing-audience-strip">
      {MARKETING_AUDIENCES.map((audience) => <li key={audience}>{audience}</li>)}
    </ul>
  );
}
