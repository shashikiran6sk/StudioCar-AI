export type SocialPlatformKey =
  | "INSTAGRAM"
  | "LINKEDIN"
  | "X"
  | "YOUTUBE"
  | "FACEBOOK";

export interface SocialPlatformPresentation {
  platform: SocialPlatformKey;
  label: string;
  displayOrder: number;
}

/**
 * The platforms the footer knows how to render, in the order it renders them.
 *
 * This is a catalog for the administration form, not seeded data. A row exists
 * only once an administrator supplies a real address, so the footer shows
 * nothing rather than a placeholder that goes nowhere.
 */
export const SOCIAL_PLATFORM_CATALOG: readonly SocialPlatformPresentation[] = [
  { platform: "INSTAGRAM", label: "Instagram", displayOrder: 0 },
  { platform: "LINKEDIN", label: "LinkedIn", displayOrder: 1 },
  { platform: "X", label: "X", displayOrder: 2 },
  { platform: "YOUTUBE", label: "YouTube", displayOrder: 3 },
  { platform: "FACEBOOK", label: "Facebook", displayOrder: 4 },
];
