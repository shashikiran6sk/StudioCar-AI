import { siteConfig } from "./site-config";

export const softwareApplicationStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  url: siteConfig.homepage,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
};

export function SoftwareApplicationJsonLd() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareApplicationStructuredData).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}
