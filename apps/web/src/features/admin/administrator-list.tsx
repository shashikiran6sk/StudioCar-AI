"use client";

import { Button, Card, StatusBadge } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import { describeAdministratorGrant } from "./describe-administrator-grant";
import { revokeAdministratorAction } from "../../server/admin/admin-management-actions";
import {
  ADMIN_REVOKE_LABEL,
  ADMINS_TITLE,
} from "../../server/admin/admin.constants";

export interface AdministratorRow {
  userId: string;
  displayName: string | null;
  email: string | null;
  source: string;
  grantedAt: string;
  grantedByName: string | null;
}

export interface AdministratorListProps {
  administrators: readonly AdministratorRow[];
  currentUserId: string;
  onlyAdministrator: boolean;
}

const UNNAMED_LABEL = "Unnamed account";
const NO_EMAIL_LABEL = "No verified email";
const YOU_LABEL = "You";
const LAST_ADMIN_HINT =
  "The only administrator cannot be revoked. Grant access to somebody else first.";

export function AdministratorList({
  administrators,
  currentUserId,
  onlyAdministrator,
}: AdministratorListProps) {
  const [message, revoke, pending] = useActionState(
    revokeAdministratorAction,
    null,
  );

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMINS_TITLE}</h2>
        <p>{onlyAdministrator ? LAST_ADMIN_HINT : ""}</p>
      </header>
      <AdminActionMessage message={message} />
      <ul className="admin-list">
        {administrators.map((administrator) => (
          <li className="admin-list__item" key={administrator.userId}>
            <div>
              <strong>{administrator.displayName ?? UNNAMED_LABEL}</strong>
              <span>{administrator.email ?? NO_EMAIL_LABEL}</span>
              <span>{describeAdministratorGrant(administrator)}</span>
            </div>
            <div className="admin-list__actions">
              {administrator.userId === currentUserId ? (
                <StatusBadge status="processing">{YOU_LABEL}</StatusBadge>
              ) : null}
              <form action={revoke}>
                <input
                  name="userId"
                  type="hidden"
                  value={administrator.userId}
                />
                <Button
                  disabled={pending || onlyAdministrator}
                  size="small"
                  type="submit"
                  variant="danger"
                >
                  {ADMIN_REVOKE_LABEL}
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
