import type { ProfileIdentity } from "@studiocar/contracts";
import { Card, StatusBadge } from "@studiocar/ui";

import { findProfileIdentity } from "./find-profile-identity";
import { formatProfileDate } from "./format-profile-date";
import { PROFILE_PROVIDER_PRESENTATIONS } from "./profile.constants";

const CARD_TITLE = "Sign-in methods";
const CARD_DESCRIPTION = "Verified identities that can access this account.";
const CONNECTED_LABEL = "Connected";
const NOT_CONNECTED_LABEL = "Not connected";
const LAST_USED_PREFIX = "Last verified";
const NEVER_USED_LABEL = "Not yet verified";

export interface ProfileIdentitiesCardProps {
  identities: readonly ProfileIdentity[];
}

export function ProfileIdentitiesCard({
  identities,
}: ProfileIdentitiesCardProps) {
  return (
    <Card className="profile-section-card">
      <header className="profile-section-card__header">
        <h2>{CARD_TITLE}</h2>
        <p>{CARD_DESCRIPTION}</p>
      </header>
      <div className="profile-identity-list">
        {PROFILE_PROVIDER_PRESENTATIONS.map((presentation) => {
          const identity = findProfileIdentity(
            identities,
            presentation.provider,
          );
          const contact = identity?.email ?? identity?.phoneNumber;
          const activity = identity?.lastAuthenticatedAt
            ? `${LAST_USED_PREFIX} ${formatProfileDate(identity.lastAuthenticatedAt)}`
            : NEVER_USED_LABEL;

          return (
            <article className="profile-identity" key={presentation.provider}>
              <div>
                <h3>{presentation.label}</h3>
                <p>{contact ?? presentation.description}</p>
                {identity ? <span>{activity}</span> : null}
              </div>
              <StatusBadge status={identity ? "completed" : "archived"}>
                {identity ? CONNECTED_LABEL : NOT_CONNECTED_LABEL}
              </StatusBadge>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
