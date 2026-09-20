import { MarketingAudienceStrip } from "../features/marketing/marketing-audience-strip";
import { MarketingFeatureSelector } from "../features/marketing/marketing-feature-selector";
import { MarketingFinalCta } from "../features/marketing/marketing-final-cta";
import { MarketingFooter } from "../features/marketing/marketing-footer";
import { MarketingHeader } from "../features/marketing/marketing-header";
import { MarketingHero } from "../features/marketing/marketing-hero";
import { MarketingStudioBackgrounds } from "../features/marketing/marketing-studio-backgrounds";
import { MarketingWorkflow } from "../features/marketing/marketing-workflow";
import { PricingSection } from "../features/pricing/pricing-section";

export default function HomePage() {
  return (
    <div className="marketing-page">
      <MarketingHeader />
      <main>
        <MarketingHero />
        <MarketingFeatureSelector />
        <MarketingAudienceStrip />
        <MarketingWorkflow />
        <MarketingStudioBackgrounds />
        <PricingSection />
        <MarketingFinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
