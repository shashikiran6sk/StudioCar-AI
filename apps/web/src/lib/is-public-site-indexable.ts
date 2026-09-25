import { AppEnvironment } from "@studiocar/config";

import { siteConfig } from "./site-config";

export function isPublicSiteIndexable(
  appEnvironment: AppEnvironment | undefined,
  vercelEnvironment: "development" | "preview" | "production" | undefined,
  host: string | null,
): boolean {
  return (
    appEnvironment === AppEnvironment.Production &&
    vercelEnvironment !== "preview" &&
    vercelEnvironment !== "development" &&
    host === new URL(siteConfig.url).host
  );
}
