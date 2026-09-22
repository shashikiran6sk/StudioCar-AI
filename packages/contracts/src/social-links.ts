import { z } from "zod";

/** The platforms the footer knows how to render. Matches the database enum. */
export const SocialPlatformSchema = z.enum([
  "INSTAGRAM",
  "LINKEDIN",
  "X",
  "YOUTUBE",
  "FACEBOOK",
]);

/** Matches `SocialLink.label`'s column width. */
export const SOCIAL_LINK_LABEL_MAX_LENGTH = 80;
/** Matches `SocialLink.url`'s column width. */
export const SOCIAL_LINK_URL_MAX_LENGTH = 2048;

/**
 * A public address the footer will send somebody to.
 *
 * `https` only, which the database's own CHECK constraint mirrors: a footer
 * link is followed by the public, and downgrading them to plaintext is not
 * something an administrator should be able to do by pasting.
 *
 * Embedded credentials are refused. `https://evil.example/@studiocar` reads as
 * a StudioCar address in a status bar but is not one, and nothing legitimate
 * needs a password in a link the whole world sees.
 */
const HTTPS_PREFIX = "https://";
const AUTHORITY_TERMINATORS = ["/", "?", "#"];

/**
 * True when nothing before the first `/`, `?` or `#` carries credentials.
 *
 * `https://evil.example/@studiocar` reads as a StudioCar address at a glance,
 * and `https://studiocar.example@evil.example` reads as one in a status bar.
 * Nothing legitimate needs a password in a link the whole world can see.
 */
function hasNoEmbeddedCredentials(value: string): boolean {
  const afterScheme = value.slice(HTTPS_PREFIX.length);
  const end = AUTHORITY_TERMINATORS.map((terminator) =>
    afterScheme.indexOf(terminator),
  ).filter((index) => index !== -1);
  const authority = afterScheme.slice(
    0,
    end.length === 0 ? afterScheme.length : Math.min(...end),
  );
  return !authority.includes("@");
}

/**
 * A public address the footer will send somebody to.
 *
 * `https` only, which the database's own CHECK constraint mirrors: a footer
 * link is followed by the public, and an administrator should not be able to
 * downgrade them to plaintext by pasting.
 */
export const SocialLinkUrlSchema = z
  .string()
  .trim()
  .max(SOCIAL_LINK_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https$/ }))
  .refine(hasNoEmbeddedCredentials, "A footer link must not carry a password.");

export const SocialLinkSchema = z
  .object({
    enabled: z.boolean(),
    label: z.string().trim().min(1).max(SOCIAL_LINK_LABEL_MAX_LENGTH),
    platform: SocialPlatformSchema,
    url: SocialLinkUrlSchema,
  })
  .strict();

export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
