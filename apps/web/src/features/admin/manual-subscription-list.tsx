"use client";

import { Button, Card } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import { formatAdminDate } from "./format-admin-date";
import { revokeSubscriptionAction } from "../../server/admin/manual-subscription-actions";
import {
  ADMIN_SUBSCRIPTION_REVOKE_LABEL,
  ADMIN_SUBSCRIPTIONS_TITLE,
} from "../../server/admin/admin.constants";

export interface ManualSubscriptionRow {
  assignedByName: string | null;
  currentPeriodEnd: string;
  displayName: string | null;
  email: string | null;
  id: string;
  note: string | null;
  planName: string;
  userId: string;
}

export interface ManualSubscriptionListProps {
  subscriptions: readonly ManualSubscriptionRow[];
}

const UNNAMED_LABEL = "Unnamed account";
const NO_EMAIL_LABEL = "No verified email";
const EMPTY_LABEL = "No plans have been assigned by hand.";

export function ManualSubscriptionList({
  subscriptions,
}: ManualSubscriptionListProps) {
  const [message, revoke, pending] = useActionState(
    revokeSubscriptionAction,
    null,
  );

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_SUBSCRIPTIONS_TITLE}</h2>
      </header>
      <AdminActionMessage message={message} />
      {subscriptions.length === 0 ? (
        <p>{EMPTY_LABEL}</p>
      ) : (
        <ul className="admin-list">
          {subscriptions.map((subscription) => (
            <li className="admin-list__item" key={subscription.id}>
              <div>
                <strong>{subscription.displayName ?? UNNAMED_LABEL}</strong>
                <span>{subscription.email ?? NO_EMAIL_LABEL}</span>
                <span>
                  {`${subscription.planName} until ${formatAdminDate(subscription.currentPeriodEnd)}${
                    subscription.assignedByName === null
                      ? ""
                      : `, assigned by ${subscription.assignedByName}`
                  }.`}
                </span>
                {subscription.note === null ? null : (
                  <span>{subscription.note}</span>
                )}
              </div>
              <div className="admin-list__actions">
                <form action={revoke}>
                  <input
                    name="userId"
                    type="hidden"
                    value={subscription.userId}
                  />
                  <Button
                    disabled={pending}
                    size="small"
                    type="submit"
                    variant="danger"
                  >
                    {ADMIN_SUBSCRIPTION_REVOKE_LABEL}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
