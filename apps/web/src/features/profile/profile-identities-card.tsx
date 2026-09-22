"use client";

import type { ProfileIdentity } from "@studiocar/contracts";
import { Button, ButtonLink, Card, StatusBadge } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConnectPhoneForm } from "./connect-phone-form";
import { findProfileIdentity } from "./find-profile-identity";
import { formatProfileDate } from "./format-profile-date";
import {
  PROFILE_CONNECTED_LABEL,
  PROFILE_IDENTITIES_DESCRIPTION,
  PROFILE_IDENTITIES_TITLE,
  PROFILE_LAST_USED_PREFIX,
  PROFILE_NEVER_USED_LABEL,
  PROFILE_NOT_CONNECTED_LABEL,
  PROFILE_PATH_FOR_RETURN,
  PROFILE_PROVIDER_PRESENTATIONS,
} from "./profile.constants";
import { createGoogleLinkHref } from "../auth/create-google-link-href";

export interface ProfileIdentitiesCardProps {
  identities: readonly ProfileIdentity[];
  notice?: string;
}

export function ProfileIdentitiesCard({
  identities,
  notice,
}: ProfileIdentitiesCardProps) {
  const router = useRouter();
  const [connectingPhone, setConnectingPhone] = useState(false);

  return (
    <Card className="profile-section-card">
      <header className="profile-section-card__header">
        <h2>{PROFILE_IDENTITIES_TITLE}</h2>
        <p>{PROFILE_IDENTITIES_DESCRIPTION}</p>
      </header>
      {notice ? (
        <p className="profile-identity__notice" role="status">
          {notice}
        </p>
      ) : null}
      <div className="profile-identity-list">
        {PROFILE_PROVIDER_PRESENTATIONS.map((presentation) => {
          const identity = findProfileIdentity(
            identities,
            presentation.provider,
          );
          const contact = identity?.email ?? identity?.phoneNumber;
          const activity = identity?.lastAuthenticatedAt
            ? `${PROFILE_LAST_USED_PREFIX} ${formatProfileDate(identity.lastAuthenticatedAt)}`
            : PROFILE_NEVER_USED_LABEL;

          return (
            <article className="profile-identity" key={presentation.provider}>
              <div>
                <h3>{presentation.label}</h3>
                <p>{contact ?? presentation.description}</p>
                {identity ? <span>{activity}</span> : null}
                {!identity && presentation.provider === "PHONE" && connectingPhone ? (
                  <ConnectPhoneForm
                    onConnected={() => {
                      setConnectingPhone(false);
                      router.refresh();
                    }}
                  />
                ) : null}
              </div>
              <div className="profile-identity__actions">
                <StatusBadge status={identity ? "completed" : "archived"}>
                  {identity
                    ? PROFILE_CONNECTED_LABEL
                    : PROFILE_NOT_CONNECTED_LABEL}
                </StatusBadge>
                {identity ? null : presentation.provider === "GOOGLE" ? (
                  <ButtonLink
                    href={createGoogleLinkHref(PROFILE_PATH_FOR_RETURN)}
                    size="small"
                    variant="secondary"
                  >
                    {presentation.connectLabel}
                  </ButtonLink>
                ) : connectingPhone ? null : (
                  <Button
                    onClick={() => setConnectingPhone(true)}
                    size="small"
                    variant="secondary"
                  >
                    {presentation.connectLabel}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
