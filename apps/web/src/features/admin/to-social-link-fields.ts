import type { SocialLink } from "@studiocar/contracts";

import type { SocialLinkFields } from "./social-link-form";
import type { SocialPlatformPresentation } from "../../server/content/social-platform-catalog";

/**
 * Pairs every platform the footer can render with whatever is configured.
 *
 * A platform with no row still gets a form, so adding a link is a matter of
 * filling one in rather than discovering a control that does not exist.
 */
export function toSocialLinkFields(
  presentation: SocialPlatformPresentation,
  configured: readonly SocialLink[],
): SocialLinkFields {
  const existing = configured.find(
    (link) => link.platform === presentation.platform,
  );

  return {
    configured: existing !== undefined,
    // A platform nobody has configured starts hidden, not live.
    enabled: existing?.enabled ?? false,
    label: existing?.label ?? "",
    platform: presentation.platform,
    platformLabel: presentation.label,
    url: existing?.url ?? "",
  };
}
