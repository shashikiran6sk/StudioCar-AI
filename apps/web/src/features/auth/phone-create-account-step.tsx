"use client";

import { Button, Field } from "@studiocar/ui";
import type { FormEvent } from "react";

import {
  PHONE_ACCOUNT_BACK_LABEL,
  PHONE_ACCOUNT_CREATE_SUBMIT_LABEL,
  PHONE_ACCOUNT_CREATE_TITLE,
  PHONE_ACCOUNT_CREATING_LABEL,
  PHONE_ACCOUNT_NAME_LABEL,
  PHONE_INPUT_LABEL,
} from "./phone-sign-in.constants";

export interface PhoneCreateAccountStepProps {
  displayName: string;
  error?: string | undefined;
  onBack: () => void;
  onDisplayNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  phoneNumber: string;
}

export function PhoneCreateAccountStep({
  displayName,
  error,
  onBack,
  onDisplayNameChange,
  onSubmit,
  pending,
  phoneNumber,
}: PhoneCreateAccountStepProps) {
  return (
    <form className="auth-form auth-account-step" onSubmit={onSubmit}>
      <h2>{PHONE_ACCOUNT_CREATE_TITLE}</h2>
      <p className="auth-form__notice">
        {PHONE_INPUT_LABEL} <strong>{phoneNumber}</strong> ✓
      </p>
      <Field
        autoComplete="name"
        error={error}
        id="account-display-name"
        label={PHONE_ACCOUNT_NAME_LABEL}
        onChange={(event) => onDisplayNameChange(event.currentTarget.value)}
        required
        value={displayName}
      />
      <Button
        className="auth-form__submit"
        disabled={pending}
        type="submit"
        variant="primary"
      >
        {pending ? PHONE_ACCOUNT_CREATING_LABEL : PHONE_ACCOUNT_CREATE_SUBMIT_LABEL}
      </Button>
      <Button disabled={pending} onClick={onBack} type="button" variant="ghost">
        {PHONE_ACCOUNT_BACK_LABEL}
      </Button>
    </form>
  );
}
