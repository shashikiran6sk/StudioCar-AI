"use client";

import { Button, Card, Field } from "@studiocar/ui";
import { useActionState } from "react";

import { AdminActionMessage } from "./admin-action-message";
import {
  removeSocialLinkAction,
  saveSocialLinkAction,
} from "../../server/content/social-link-actions";
import {
  SOCIAL_LINK_ENABLED_LABEL,
  SOCIAL_LINK_LABEL_LABEL,
  SOCIAL_LINK_REMOVE_LABEL,
  SOCIAL_LINK_SAVE_LABEL,
  SOCIAL_LINK_URL_HINT,
  SOCIAL_LINK_URL_LABEL,
} from "../../server/content/content.constants";

export interface SocialLinkFields {
  configured: boolean;
  enabled: boolean;
  label: string;
  platform: string;
  platformLabel: string;
  url: string;
}

export interface SocialLinkFormProps {
  link: SocialLinkFields;
}

export function SocialLinkForm({ link }: SocialLinkFormProps) {
  const [saveMessage, save, saving] = useActionState(
    saveSocialLinkAction,
    null,
  );
  const [removeMessage, remove, removing] = useActionState(
    removeSocialLinkAction,
    null,
  );
  const fieldId = (field: string) => `social-${link.platform}-${field}`;

  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{link.platformLabel}</h2>
      </header>
      <form action={save} className="admin-plan-form">
        <input name="platform" type="hidden" value={link.platform} />
        <Field
          defaultValue={link.url}
          hint={SOCIAL_LINK_URL_HINT}
          id={fieldId("url")}
          inputMode="url"
          label={SOCIAL_LINK_URL_LABEL}
          name="url"
          placeholder="https://"
          required
          type="url"
        />
        <Field
          defaultValue={link.label === "" ? link.platformLabel : link.label}
          id={fieldId("label")}
          label={SOCIAL_LINK_LABEL_LABEL}
          name="label"
          required
        />
        <div className="admin-plan-form__toggles">
          <label
            className="admin-plan-form__toggle"
            htmlFor={fieldId("enabled")}
          >
            <input
              defaultChecked={link.enabled}
              id={fieldId("enabled")}
              name="enabled"
              type="checkbox"
            />
            {SOCIAL_LINK_ENABLED_LABEL}
          </label>
        </div>
        <Button disabled={saving} type="submit" variant="primary">
          {SOCIAL_LINK_SAVE_LABEL}
        </Button>
      </form>
      <AdminActionMessage message={saveMessage} />
      {link.configured ? (
        <form action={remove}>
          <input name="platform" type="hidden" value={link.platform} />
          <Button
            disabled={removing}
            size="small"
            type="submit"
            variant="danger"
          >
            {SOCIAL_LINK_REMOVE_LABEL}
          </Button>
        </form>
      ) : null}
      <AdminActionMessage message={removeMessage} />
    </Card>
  );
}
