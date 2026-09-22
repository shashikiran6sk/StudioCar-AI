"use client";

import { Button, Card, Field } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import { grantAdministratorAction } from "../../server/admin/admin-management-actions";
import {
  ADMIN_GRANT_EMAIL_LABEL,
  ADMIN_GRANT_LABEL,
  ADMIN_GRANT_SUBMIT_LABEL,
} from "../../server/admin/admin.constants";

const HINT =
  "Access is granted at once if a verified Google account already holds this address. Otherwise an invitation waits until somebody signs in with it.";

export function GrantAdministratorForm() {
  const [message, submit, pending] = useActionState(
    grantAdministratorAction,
    null,
  );

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_GRANT_LABEL}</h2>
        <p>{HINT}</p>
      </header>
      <form action={submit} className="admin-grant-form">
        <Field
          autoComplete="email"
          id="admin-grant-email"
          label={ADMIN_GRANT_EMAIL_LABEL}
          name="email"
          required
          type="email"
        />
        <Button disabled={pending} type="submit" variant="primary">
          {ADMIN_GRANT_SUBMIT_LABEL}
        </Button>
      </form>
      <AdminActionMessage message={message} />
    </Card>
  );
}
