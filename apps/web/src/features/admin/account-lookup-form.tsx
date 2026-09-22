import { Button, Card, Field } from "@studiocar/ui";

import {
  ADMIN_LOOKUP_FIELD_LABEL,
  ADMIN_LOOKUP_HINT,
  ADMIN_LOOKUP_LABEL,
  ADMIN_LOOKUP_QUERY_KEY,
  ADMIN_LOOKUP_SUBMIT_LABEL,
  ADMIN_SUBSCRIPTIONS_PATH,
} from "../../server/admin/admin.constants";

export interface AccountLookupFormProps {
  value: string;
}

/**
 * A plain GET form, so a lookup is a bookmarkable address rather than client
 * state. `Referrer-Policy` keeps the query off cross-origin requests.
 */
export function AccountLookupForm({ value }: AccountLookupFormProps) {
  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_LOOKUP_LABEL}</h2>
        <p>{ADMIN_LOOKUP_HINT}</p>
      </header>
      <form action={ADMIN_SUBSCRIPTIONS_PATH} className="admin-grant-form">
        <Field
          defaultValue={value}
          id="admin-account-lookup"
          label={ADMIN_LOOKUP_FIELD_LABEL}
          name={ADMIN_LOOKUP_QUERY_KEY}
          required
        />
        <Button type="submit" variant="primary">
          {ADMIN_LOOKUP_SUBMIT_LABEL}
        </Button>
      </form>
    </Card>
  );
}
