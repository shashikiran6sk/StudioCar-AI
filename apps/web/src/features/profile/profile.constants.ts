import type { ProfileIdentityProvider } from "@studiocar/contracts";

export interface ProfileProviderPresentation {
  description: string;
  label: string;
  provider: ProfileIdentityProvider;
}

export const PROFILE_PROVIDER_PRESENTATIONS: readonly ProfileProviderPresentation[] = [
  {
    provider: "GOOGLE",
    label: "Google",
    description: "OAuth identity with a verified Google email.",
  },
  {
    provider: "PHONE",
    label: "Phone",
    description: "Verified mobile identity secured through one-time codes.",
  },
];
