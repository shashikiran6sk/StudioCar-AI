import { parseSeoEnvironment } from "@studiocar/config";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { isPublicSiteIndexable } from "../lib/is-public-site-indexable";
import { privateRoutePrefixes } from "../lib/seo-routes";
import { siteConfig } from "../lib/site-config";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const environment = parseSeoEnvironment(process.env);
  const requestHeaders = await headers();
  const indexable = isPublicSiteIndexable(
    environment.APP_ENV,
    environment.VERCEL_ENV,
    requestHeaders.get("host"),
  );

  return {
    rules: {
      userAgent: "*",
      ...(indexable
        ? { allow: "/", disallow: privateRoutePrefixes }
        : { disallow: "/" }),
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
