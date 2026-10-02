import type { SocialLink } from "@studiocar/contracts";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { PUBLIC_SOCIAL_LINKS_CACHE_TAG } from "./content.constants";
import { getSocialLinkRepository } from "./social-link-runtime";
import { toSocialLink } from "./to-social-link";

async function readEnabledSocialLinks(): Promise<readonly SocialLink[]> {
  return (await getSocialLinkRepository().findEnabled()).map(toSocialLink);
}

/**
 * The links the public footer shows.
 *
 * There is no fallback and no shipped default. A footer link is an address
 * somebody will follow, so it exists only once an administrator has supplied a
 * real one; an empty result renders nothing rather than a dead link.
 */
export const getEnabledSocialLinks = cache(
  readEnabledSocialLinks,
);

/** Public footer data is shared across requests and invalidated by admin edits. */
const readCachedPublicSocialLinks = unstable_cache(
  readEnabledSocialLinks,
  ["public-social-links"],
  { tags: [PUBLIC_SOCIAL_LINKS_CACHE_TAG] },
);

export const getPublicEnabledSocialLinks = cache(
  (): Promise<readonly SocialLink[]> => readCachedPublicSocialLinks(),
);

/** Every configured link, including hidden ones, for the administration page. */
export const getAllSocialLinks = cache(
  async (): Promise<readonly SocialLink[]> =>
    (await getSocialLinkRepository().findAll()).map(toSocialLink),
);
