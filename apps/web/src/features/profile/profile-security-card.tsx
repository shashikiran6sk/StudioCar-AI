import { Button, Card } from "@studiocar/ui";

import {
  LOGOUT_ALL_PATH,
  LOGOUT_PATH,
} from "../../app/app-routes";
import { formatProfileDate } from "./format-profile-date";

const CARD_TITLE = "Session security";
const CARD_DESCRIPTION = "Review active access and revoke sessions when needed.";
const ACTIVE_SESSION_LABEL = "Active sessions";
const CURRENT_EXPIRY_LABEL = "Current session expires";
const LOGOUT_LABEL = "Log out this device";
const LOGOUT_ALL_LABEL = "Log out all devices";
const LOGOUT_ALL_DESCRIPTION =
  "This immediately revokes every active session, including this device.";

export interface ProfileSecurityCardProps {
  activeSessionCount: number;
  currentSessionExpiresAt: Date;
}

export function ProfileSecurityCard({
  activeSessionCount,
  currentSessionExpiresAt,
}: ProfileSecurityCardProps) {
  return (
    <Card className="profile-section-card profile-security-card">
      <header className="profile-section-card__header">
        <h2>{CARD_TITLE}</h2>
        <p>{CARD_DESCRIPTION}</p>
      </header>
      <dl className="profile-security-summary">
        <div>
          <dt>{ACTIVE_SESSION_LABEL}</dt>
          <dd>{activeSessionCount}</dd>
        </div>
        <div>
          <dt>{CURRENT_EXPIRY_LABEL}</dt>
          <dd>{formatProfileDate(currentSessionExpiresAt)}</dd>
        </div>
      </dl>
      <div className="profile-security-card__actions">
        <form action={LOGOUT_PATH} method="post">
          <Button type="submit">{LOGOUT_LABEL}</Button>
        </form>
        <div className="profile-security-card__danger">
          <p>{LOGOUT_ALL_DESCRIPTION}</p>
          <form action={LOGOUT_ALL_PATH} method="post">
            <Button type="submit" variant="danger">
              {LOGOUT_ALL_LABEL}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
