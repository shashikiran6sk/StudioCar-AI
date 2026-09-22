"use client";

import { Button, Card } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import {
  describeInvitation,
  describeInvitationExpiry,
} from "./describe-invitation";
import { revokeInvitationAction } from "../../server/admin/admin-management-actions";
import { ADMIN_INVITE_REVOKE_LABEL } from "../../server/admin/admin.constants";

export interface AdministratorInviteRow {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  invitedByName: string | null;
}

export interface AdministratorInviteListProps {
  invites: readonly AdministratorInviteRow[];
}

const TITLE = "Pending invitations";
const EMPTY_DESCRIPTION = "No invitations are waiting.";
const DESCRIPTION =
  "Each activates only when somebody signs in with a Google account Google has verified for that address.";

export function AdministratorInviteList({
  invites,
}: AdministratorInviteListProps) {
  const [message, revoke, pending] = useActionState(
    revokeInvitationAction,
    null,
  );

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{TITLE}</h2>
        <p>{invites.length === 0 ? EMPTY_DESCRIPTION : DESCRIPTION}</p>
      </header>
      <AdminActionMessage message={message} />
      <ul className="admin-list">
        {invites.map((invite) => (
          <li className="admin-list__item" key={invite.id}>
            <div>
              <strong>{invite.email}</strong>
              <span>{describeInvitation(invite)}</span>
              <span>{describeInvitationExpiry(invite.expiresAt)}</span>
            </div>
            <form action={revoke}>
              <input name="inviteId" type="hidden" value={invite.id} />
              <Button
                disabled={pending}
                size="small"
                type="submit"
                variant="ghost"
              >
                {ADMIN_INVITE_REVOKE_LABEL}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}
