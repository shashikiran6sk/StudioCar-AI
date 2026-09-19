import type { AuthUser } from "@studiocar/contracts";
import { Card } from "@studiocar/ui";

import { ProfileForm } from "./profile-form";

const CARD_TITLE = "Personal details";
const CARD_DESCRIPTION = "Manage how your account appears across StudioCar AI.";
const EMAIL_LABEL = "Email";
const PHONE_LABEL = "Phone";
const NOT_CONNECTED_LABEL = "Not connected";

export interface ProfileDetailsCardProps {
  user: AuthUser;
}

export function ProfileDetailsCard({ user }: ProfileDetailsCardProps) {
  return (
    <Card className="profile-section-card">
      <header className="profile-section-card__header">
        <h2>{CARD_TITLE}</h2>
        <p>{CARD_DESCRIPTION}</p>
      </header>
      <ProfileForm initialDisplayName={user.displayName ?? ""} />
      <dl className="profile-contact-list">
        <div>
          <dt>{EMAIL_LABEL}</dt>
          <dd>{user.primaryEmail ?? NOT_CONNECTED_LABEL}</dd>
        </div>
        <div>
          <dt>{PHONE_LABEL}</dt>
          <dd>{user.primaryPhone ?? NOT_CONNECTED_LABEL}</dd>
        </div>
      </dl>
    </Card>
  );
}
