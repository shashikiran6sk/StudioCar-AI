import type { SocialLink } from "@studiocar/contracts";
import { cache } from "react";

import { getSocialLinkRepository } from "./social-link-runtime";
import { toSocialLink } from "./to-social-link";

/**
 * The links the public footer shows.
 *
 * There is no fallback and no shipped default. A footer link is an address
 * somebody will follow, so it exists only once an administrator has supplied a
 * real one; an empty result renders nothing rather than a dead link.
 */
export const getEnabledSocialLinks = cache(
  async (): Promise<readonly SocialLink[]> =>
    (await getSocialLinkRepository().findEnabled()).map(toSocialLink),
);

/** Every configured link, including hidden ones, for the administration page. */
export const getAllSocialLinks = cache(
  async (): Promise<readonly SocialLink[]> =>
    (await getSocialLinkRepository().findAll()).map(toSocialLink),
);
