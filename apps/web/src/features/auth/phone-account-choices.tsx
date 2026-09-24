"use client";

import { Button, ButtonLink } from "@studiocar/ui";

import { createGoogleVerifiedPhoneLinkHref } from "./create-google-verified-phone-link-href";
import {
  PHONE_ACCOUNT_CHOICES_DESCRIPTION,
  PHONE_ACCOUNT_CREATE_LABEL,
  PHONE_ACCOUNT_GOOGLE_LABEL,
  PHONE_ACCOUNT_VERIFIED_TITLE,
  PHONE_AUTH_DIVIDER_LABEL,
  PHONE_GOOGLE_MARK,
} from "./phone-sign-in.constants";

export interface PhoneAccountChoicesProps {
  error?: string | undefined;
  onCreate: () => void;
  phoneNumber: string;
  returnTo: string;
}

export function PhoneAccountChoices({
  error,
  onCreate,
  phoneNumber,
  returnTo,
}: PhoneAccountChoicesProps) {
  return (
    <div className="auth-form auth-account-step">
      <p className="auth-form__notice" role="status">
        {PHONE_ACCOUNT_VERIFIED_TITLE} ✓ <strong>{phoneNumber}</strong>
      </p>
      <p>{PHONE_ACCOUNT_CHOICES_DESCRIPTION}</p>
      {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
      <ButtonLink
        className="auth-card__google"
        href={createGoogleVerifiedPhoneLinkHref(returnTo)}
      >
        <span aria-hidden="true" className="auth-card__google-mark">
          {PHONE_GOOGLE_MARK}
        </span>
        {PHONE_ACCOUNT_GOOGLE_LABEL}
      </ButtonLink>
      <div className="auth-divider"><span>{PHONE_AUTH_DIVIDER_LABEL}</span></div>
      <Button className="auth-form__submit" onClick={onCreate} type="button" variant="primary">
        {PHONE_ACCOUNT_CREATE_LABEL}
      </Button>
    </div>
  );
}
