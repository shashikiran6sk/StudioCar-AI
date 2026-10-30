/**
 * Changed whenever the logo files change, so browsers and Google fetch the new
 * icons instead of reusing a cached copy of the old ones.
 */
const BRAND_ASSET_VERSION = "2";

export const siteConfig = {
  name: "StudioCar AI",
  url: "https://studiocarai.com",
  homepage: "https://studiocarai.com/",
  title: "StudioCar AI | AI Car Photography for Dealers",
  description:
    "Transform ordinary vehicle photos into professional studio-quality images using AI. StudioCar AI helps automotive dealers remove backgrounds, apply studio environments and create consistent dealership-ready vehicle photos.",
  openGraphImage: `/opengraph-image.png?v=${BRAND_ASSET_VERSION}`,
  icons: {
    icon: [
      { url: `/icon.png?v=${BRAND_ASSET_VERSION}`, type: "image/png", sizes: "192x192" },
      {
        url: `/favicon.ico?v=${BRAND_ASSET_VERSION}`,
        type: "image/x-icon",
        sizes: "16x16 32x32 48x48",
      },
    ],
    apple: [
      { url: `/apple-icon.png?v=${BRAND_ASSET_VERSION}`, type: "image/png", sizes: "180x180" },
    ],
  },
};
