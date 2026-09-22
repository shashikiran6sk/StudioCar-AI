import type { SocialLink } from "@studiocar/contracts";

import type { SocialLinkRecord } from "../db/repositories/social-link-repository";

/**
 * Turns a stored link into what a page reads.
 *
 * `displayOrder` is dropped: it decided the order the rows arrived in, and
 * carrying it further would invite somebody to sort by it a second time.
 */
export function toSocialLink(record: SocialLinkRecord): SocialLink {
  return {
    enabled: record.enabled,
    label: record.label,
    platform: record.platform,
    url: record.url,
  };
}
