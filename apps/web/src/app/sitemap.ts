import { parseSeoEnvironment } from "@studiocar/config";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { isPublicSiteIndexable } from "../lib/is-public-site-indexable";
import { siteConfig } from "../lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const environment = parseSeoEnvironment(process.env);
  const requestHeaders = await headers();

  return isPublicSiteIndexable(
    environment.APP_ENV,
    environment.VERCEL_ENV,
    requestHeaders.get("host"),
  )
    ? [{ url: siteConfig.homepage, changeFrequency: "monthly", priority: 1 }]
    : [];
}
