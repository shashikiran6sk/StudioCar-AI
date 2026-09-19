import type {
  ProfileIdentity,
  ProfileIdentityProvider,
} from "@studiocar/contracts";

export function findProfileIdentity(
  identities: readonly ProfileIdentity[],
  provider: ProfileIdentityProvider,
): ProfileIdentity | undefined {
  return identities.find((identity) => identity.provider === provider);
}
