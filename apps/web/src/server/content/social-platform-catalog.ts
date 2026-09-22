import type { SocialPlatform } from "@studiocar/contracts";

export interface SocialPlatformPresentation {
  displayOrder: number;
  label: string;
  platform: SocialPlatform;
}

/**
 * The platforms the footer knows how to render, in the order it renders them.
 *
 * This is a catalog for the administration form, not seeded data. A row exists
 * only once an administrator supplies a real address, so the footer shows
 * nothing rather than a placeholder that goes nowhere.
 */
export const SOCIAL_PLATFORM_CATALOG: readonly SocialPlatformPresentation[] = [
  { displayOrder: 0, label: "Instagram", platform: "INSTAGRAM" },
  { displayOrder: 1, label: "LinkedIn", platform: "LINKEDIN" },
  { displayOrder: 2, label: "X", platform: "X" },
  { displayOrder: 3, label: "YouTube", platform: "YOUTUBE" },
  { displayOrder: 4, label: "Facebook", platform: "FACEBOOK" },
];
