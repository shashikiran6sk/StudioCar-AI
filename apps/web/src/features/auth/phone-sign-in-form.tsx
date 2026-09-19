"use client";

import {
  ApiErrorSchema,
  PhoneStartResponseSchema,
  PhoneStartSchema,
  PhoneVerifyResponseSchema,
  PhoneVerifySchema,
} from "@studiocar/contracts";
import { Button, Field } from "@studiocar/ui";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  PHONE_AUTH_START_PATH,
  PHONE_AUTH_VERIFY_PATH,
} from "../../app/app-routes";
import { readResponseJson } from "./read-response-json";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const OTP_SENT_MESSAGE = "We sent a verification code to";
const JSON_CONTENT_TYPE = "application/json";
const PHONE_INPUT_LABEL = "Phone number";
const PHONE_INPUT_PLACEHOLDER = "+91 98765 43210";
const OTP_INPUT_LABEL = "Verification code";
const OTP_INPUT_PLACEHOLDER = "Enter your OTP";
const PHONE_PENDING_LABEL = "Sending code…";
const PHONE_SUBMIT_LABEL = "Continue with phone";
const OTP_PENDING_LABEL = "Verifying…";
const OTP_SUBMIT_LABEL = "Verify and continue";
const CHANGE_PHONE_LABEL = "Use a different number";

export interface PhoneSignInFormProps {
  returnTo: string;
}

export function PhoneSignInForm({ returnTo }: PhoneSignInFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalizedPhoneNumber, setNormalizedPhoneNumber] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const phoneInput = useRef<HTMLInputElement>(null);
  const otpInput = useRef<HTMLInputElement>(null);
  const awaitingOtp = challengeId.length > 0;

  useEffect(() => {
    if (awaitingOtp) otpInput.current?.focus();
  }, [awaitingOtp]);

  async function startVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const input = PhoneStartSchema.safeParse({ phoneNumber });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE);
      phoneInput.current?.focus();
      return;
    }

    setPending(true);
    try {
      const response = await fetch(PHONE_AUTH_START_PATH, {
        method: "POST",
        headers: { "content-type": JSON_CONTENT_TYPE },
        body: JSON.stringify(input.data),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(payload);
        setError(
          apiError.success ? apiError.data.error.message : GENERIC_ERROR_MESSAGE,
        );
        return;
      }
      const started = PhoneStartResponseSchema.safeParse(payload);
      if (!started.success) {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }
      setNormalizedPhoneNumber(input.data.phoneNumber);
      setChallengeId(started.data.challengeId);
      setOtp("");
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const input = PhoneVerifySchema.safeParse({
      challengeId,
      phoneNumber: normalizedPhoneNumber,
      otp,
    });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? GENERIC_ERROR_MESSAGE);
      otpInput.current?.focus();
      return;
    }

    setPending(true);
    try {
      const response = await fetch(PHONE_AUTH_VERIFY_PATH, {
        method: "POST",
        headers: { "content-type": JSON_CONTENT_TYPE },
        body: JSON.stringify(input.data),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(payload);
        setError(
          apiError.success ? apiError.data.error.message : GENERIC_ERROR_MESSAGE,
        );
        return;
      }
      const verified = PhoneVerifyResponseSchema.safeParse(payload);
      if (!verified.success) {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }
      window.location.assign(returnTo);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  function changePhoneNumber() {
    setChallengeId("");
    setOtp("");
    setError(undefined);
    queueMicrotask(() => phoneInput.current?.focus());
  }

  if (awaitingOtp) {
    return (
      <form className="auth-form" onSubmit={verifyOtp}>
        <p className="auth-form__notice">
          {OTP_SENT_MESSAGE} <strong>{normalizedPhoneNumber}</strong>.
        </p>
        <Field
          autoComplete="one-time-code"
          error={error}
          id="phone-otp"
          inputMode="numeric"
          label={OTP_INPUT_LABEL}
          onChange={(event) => setOtp(event.currentTarget.value)}
          pattern="[0-9]*"
          placeholder={OTP_INPUT_PLACEHOLDER}
          ref={otpInput}
          required
          value={otp}
        />
        <Button className="auth-form__submit" disabled={pending} type="submit" variant="primary">
          {pending ? OTP_PENDING_LABEL : OTP_SUBMIT_LABEL}
        </Button>
        <Button disabled={pending} onClick={changePhoneNumber} type="button" variant="ghost">
          {CHANGE_PHONE_LABEL}
        </Button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={startVerification}>
      <Field
        autoComplete="tel"
        error={error}
        id="phone-number"
        inputMode="tel"
        label={PHONE_INPUT_LABEL}
        onChange={(event) => setPhoneNumber(event.currentTarget.value)}
        placeholder={PHONE_INPUT_PLACEHOLDER}
        ref={phoneInput}
        required
        value={phoneNumber}
      />
      <Button className="auth-form__submit" disabled={pending} type="submit" variant="primary">
        {pending ? PHONE_PENDING_LABEL : PHONE_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
