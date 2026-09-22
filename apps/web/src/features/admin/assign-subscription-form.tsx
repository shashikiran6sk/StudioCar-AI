"use client";

import { Button, Card, Field, TextareaField } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import { assignSubscriptionAction } from "../../server/admin/manual-subscription-actions";
import {
  ADMIN_ASSIGN_LABEL,
  ADMIN_ASSIGN_MONTHS_LABEL,
  ADMIN_ASSIGN_NOTE_LABEL,
  ADMIN_ASSIGN_PLAN_LABEL,
  ADMIN_ASSIGN_SUBMIT_LABEL,
} from "../../server/admin/admin.constants";

export interface AssignablePlan {
  displayName: string;
  planKey: string;
}

export interface AssignSubscriptionFormProps {
  accountLabel: string;
  /** The plan the account is on, so the control agrees with the sentence above it. */
  currentPlanKey: string | null;
  defaultMonths: number;
  maximumMonths: number;
  minimumMonths: number;
  plans: readonly AssignablePlan[];
  userId: string;
}

export function AssignSubscriptionForm({
  accountLabel,
  currentPlanKey,
  defaultMonths,
  maximumMonths,
  minimumMonths,
  plans,
  userId,
}: AssignSubscriptionFormProps) {
  const [message, assign, pending] = useActionState(
    assignSubscriptionAction,
    null,
  );
  const selected =
    plans.find((plan) => plan.planKey === currentPlanKey)?.planKey ??
    plans[0]?.planKey;

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_ASSIGN_LABEL}</h2>
        <p>{accountLabel}</p>
      </header>
      <form action={assign} className="admin-plan-form">
        <input name="userId" type="hidden" value={userId} />
        <div className="sc-field">
          <label className="sc-field__label" htmlFor="admin-assign-plan">
            {ADMIN_ASSIGN_PLAN_LABEL}
          </label>
          <select
            className="sc-input"
            defaultValue={selected}
            id="admin-assign-plan"
            key={selected}
            name="planKey"
          >
            {plans.map((plan) => (
              <option key={plan.planKey} value={plan.planKey}>
                {plan.displayName}
              </option>
            ))}
          </select>
        </div>
        <Field
          defaultValue={String(defaultMonths)}
          id="admin-assign-months"
          inputMode="numeric"
          label={ADMIN_ASSIGN_MONTHS_LABEL}
          max={maximumMonths}
          min={minimumMonths}
          name="months"
          required
          type="number"
        />
        <TextareaField
          id="admin-assign-note"
          label={ADMIN_ASSIGN_NOTE_LABEL}
          name="note"
          rows={2}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {ADMIN_ASSIGN_SUBMIT_LABEL}
        </Button>
      </form>
      <AdminActionMessage message={message} />
    </Card>
  );
}
