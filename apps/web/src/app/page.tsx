import { MarketingAudienceStrip } from "../features/marketing/marketing-audience-strip";
import { MarketingFeatureSelector } from "../features/marketing/marketing-feature-selector";
import { MarketingFinalCta } from "../features/marketing/marketing-final-cta";
import { MarketingFooter } from "../features/marketing/marketing-footer";
import { MarketingHeader } from "../features/marketing/marketing-header";
import { MarketingHero } from "../features/marketing/marketing-hero";
import { MarketingStudioBackgrounds } from "../features/marketing/marketing-studio-backgrounds";
import { MarketingWorkflow } from "../features/marketing/marketing-workflow";
import { PricingSection } from "../features/pricing/pricing-section";
import { getCurrentSession } from "../server/auth/get-current-session";
import { getEnabledSocialLinks } from "../server/content/get-social-links";
import { getPlanCatalog } from "../server/plans/get-plan-catalog";
import { isPublicSiteIndexable } from "../lib/is-public-site-indexable";
import { SoftwareApplicationJsonLd } from "../lib/software-application-json-ld";
import { siteConfig } from "../lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const environment = parseSeoEnvironment(process.env);
  const requestHeaders = await headers();
  const indexable = isPublicSiteIndexable(
    environment.APP_ENV,
    environment.VERCEL_ENV,
    requestHeaders.get("host"),
  );

  return {
    title: siteConfig.title,
    description: siteConfig.description,
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: siteConfig.name,
      url: new URL(siteConfig.homepage),
      title: siteConfig.title,
      description: siteConfig.description,
      images: [{ url: siteConfig.openGraphImage, width: 1200, height: 630, alt: "StudioCar AI vehicle photography" }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [siteConfig.openGraphImage],
    },
    ...(environment.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: environment.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

/**
 * Prices and footer links are configuration, so the landing page reads them
 * rather than shipping a copy that an administrator's edit would leave stale.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [plans, socialLinks, session] = await Promise.all([
    getPlanCatalog(),
    getEnabledSocialLinks(),
    getCurrentSession(),
  ]);

  return (
    <div className="marketing-page">
      <link href={siteConfig.homepage} rel="canonical" />
      <MarketingHeader user={session?.user ?? null} />
      <SoftwareApplicationJsonLd />
      <main>
        <MarketingHero />
        <MarketingFeatureSelector />
        <MarketingAudienceStrip />
        <MarketingWorkflow />
        <MarketingStudioBackgrounds />
        <PricingSection plans={plans} />
        <MarketingFinalCta />
      </main>
      <MarketingFooter socialLinks={socialLinks} />
    </div>
  );
}
import { parseSeoEnvironment } from "@studiocar/config";
import type { Metadata } from "next";
import { headers } from "next/headers";
