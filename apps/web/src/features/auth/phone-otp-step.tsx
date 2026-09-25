"use client";

import { Button, Field } from "@studiocar/ui";
import { forwardRef, type FormEvent } from "react";

import {
  PHONE_CAPTCHA_CONTAINER_CLASS,
  PHONE_CHANGE_NUMBER_LABEL,
  PHONE_DEVELOPMENT_NOTICE,
  PHONE_OTP_FALLBACK_MAX_LENGTH,
  PHONE_OTP_INPUT_LABEL,
  PHONE_OTP_INPUT_PLACEHOLDER,
  PHONE_OTP_PENDING_LABEL,
  PHONE_OTP_SENT_MESSAGE,
  PHONE_OTP_SUBMIT_LABEL,
  PHONE_OTP_TITLE,
  PHONE_RESEND_COUNTDOWN_PREFIX,
  PHONE_RESEND_COUNTDOWN_SUFFIX,
  PHONE_RESEND_LABEL,
  PHONE_RESEND_PENDING_LABEL,
  PHONE_RESEND_PROMPT,
} from "./phone-sign-in.constants";

const OTP_INPUT_ID = "phone-otp";
const OTP_ERROR_ID = "phone-otp-error";

export interface PhoneOtpStepProps {
  captchaId: string;
  code: string;
  codeLength: number | null;
  canVerify: boolean;
  developmentMode: boolean;
  error?: string | undefined;
  maskedPhoneNumber: string;
  notice?: string | undefined;
  onChangeNumber: () => void;
  onCodeChange: (value: string) => void;
  onResend: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  resendCountdownSeconds: number;
  resending: boolean;
}

export const PhoneOtpStep = forwardRef<HTMLInputElement, PhoneOtpStepProps>(
  function PhoneOtpStep(
    {
      captchaId,
      code,
      codeLength,
      canVerify,
      developmentMode,
      error,
      maskedPhoneNumber,
      notice,
      onChangeNumber,
      onCodeChange,
      onResend,
      onSubmit,
      pending,
      resendCountdownSeconds,
      resending,
    },
    ref,
  ) {
    const busy = pending || resending;
    const coolingDown = resendCountdownSeconds > 0;

    return (
      <form className="auth-form auth-account-step" onSubmit={onSubmit}>
        <h2>{PHONE_OTP_TITLE}</h2>
        <p className="auth-form__notice">
          {PHONE_OTP_SENT_MESSAGE} <strong>{maskedPhoneNumber}</strong>
        </p>
        {developmentMode ? (
          <p className="auth-form__notice">{PHONE_DEVELOPMENT_NOTICE}</p>
        ) : null}
        <div className={PHONE_CAPTCHA_CONTAINER_CLASS} id={captchaId} />
        <Field
          aria-describedby={error ? OTP_ERROR_ID : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="one-time-code"
          id={OTP_INPUT_ID}
          inputMode="numeric"
          label={PHONE_OTP_INPUT_LABEL}
          maxLength={codeLength ?? PHONE_OTP_FALLBACK_MAX_LENGTH}
          onChange={(event) => onCodeChange(event.currentTarget.value)}
          pattern="[0-9]*"
          placeholder={PHONE_OTP_INPUT_PLACEHOLDER}
          ref={ref}
          required
          value={code}
        />
        {error ? (
          <p className="auth-form__error" id={OTP_ERROR_ID} role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="auth-form__notice" role="status">
            {notice}
          </p>
        ) : null}
        <Button
          className="auth-form__submit"
          disabled={busy || !canVerify}
          type="submit"
          variant="primary"
        >
          {pending ? PHONE_OTP_PENDING_LABEL : PHONE_OTP_SUBMIT_LABEL}
        </Button>
        <p>{PHONE_RESEND_PROMPT}</p>
        <Button
          disabled={busy || coolingDown}
          onClick={onResend}
          type="button"
          variant="ghost"
        >
          {resending
            ? PHONE_RESEND_PENDING_LABEL
            : coolingDown
              ? `${PHONE_RESEND_COUNTDOWN_PREFIX} ${resendCountdownSeconds}${PHONE_RESEND_COUNTDOWN_SUFFIX}`
              : PHONE_RESEND_LABEL}
        </Button>
        <Button
          disabled={busy}
          onClick={onChangeNumber}
          type="button"
          variant="ghost"
        >
          {PHONE_CHANGE_NUMBER_LABEL}
        </Button>
      </form>
    );
  },
);
