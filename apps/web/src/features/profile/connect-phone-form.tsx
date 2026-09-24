"use client";

import {
  ApiErrorSchema,
  PhoneStartResponseSchema,
  PhoneStartSchema,
  type PhoneOtpWidget,
} from "@studiocar/contracts";
import { Button, Field } from "@studiocar/ui";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import {
  PHONE_AUTH_START_PATH,
  PROFILE_PHONE_IDENTITY_PATH,
} from "../../app/app-routes";
import { createDevelopmentAccessToken } from "../auth/create-development-access-token";
import { loadMsg91Widget } from "../auth/msg91-widget/load-msg91-widget";
import { sendMsg91Otp } from "../auth/msg91-widget/send-msg91-otp";
import { verifyMsg91Otp } from "../auth/msg91-widget/verify-msg91-otp";
import {
  PHONE_CAPTCHA_CONTAINER_CLASS,
  PHONE_GENERIC_ERROR_MESSAGE,
  PHONE_INPUT_LABEL,
  PHONE_INPUT_PLACEHOLDER,
  PHONE_JSON_CONTENT_TYPE,
  PHONE_OTP_INPUT_LABEL,
  PHONE_OTP_INPUT_PLACEHOLDER,
  PHONE_OTP_PENDING_LABEL,
  PHONE_PENDING_LABEL,
  PHONE_WIDGET_UNAVAILABLE_MESSAGE,
} from "../auth/phone-sign-in.constants";
import { readResponseJson } from "../auth/read-response-json";
import { requestPhoneOtpWidget } from "../auth/request-phone-otp-widget";
import { toWidgetIdentifier } from "../auth/to-widget-identifier";

const SEND_LABEL = "Send verification code";
const CONNECT_LABEL = "Connect phone";
const CANCEL_LABEL = "Cancel";

export interface ConnectPhoneFormProps {
  onConnected: () => void;
}

export function ConnectPhoneForm({ onConnected }: ConnectPhoneFormProps) {
  const captchaId = useId();
  const [widget, setWidget] = useState<PhoneOtpWidget | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalized, setNormalized] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const otpInput = useRef<HTMLInputElement>(null);
  const awaitingOtp = challengeId.length > 0;

  useEffect(() => {
    let active = true;
    void requestPhoneOtpWidget().then((resolved) => {
      if (active) setWidget(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (awaitingOtp) otpInput.current?.focus();
  }, [awaitingOtp]);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const input = PhoneStartSchema.safeParse({ phoneNumber });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? PHONE_GENERIC_ERROR_MESSAGE);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(PHONE_AUTH_START_PATH, {
        method: "POST",
        headers: { "content-type": PHONE_JSON_CONTENT_TYPE },
        body: JSON.stringify(input.data),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(payload);
        setError(
          apiError.success
            ? apiError.data.error.message
            : PHONE_GENERIC_ERROR_MESSAGE,
        );
        return;
      }
      const started = PhoneStartResponseSchema.safeParse(payload);
      if (!started.success) {
        setError(PHONE_GENERIC_ERROR_MESSAGE);
        return;
      }

      if (widget?.driver === "msg91") {
        await loadMsg91Widget({
          widgetId: widget.widgetId ?? "",
          tokenAuth: widget.tokenAuth ?? "",
          captchaRenderId: captchaId,
        });
        await sendMsg91Otp(toWidgetIdentifier(input.data.phoneNumber));
      }

      setNormalized(input.data.phoneNumber);
      setChallengeId(started.data.challengeId);
      setOtp("");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (!widget) {
      setError(PHONE_WIDGET_UNAVAILABLE_MESSAGE);
      return;
    }

    setPending(true);
    try {
      const accessToken =
        widget.driver === "msg91"
          ? await verifyMsg91Otp(otp)
          : createDevelopmentAccessToken(
              toWidgetIdentifier(normalized),
              otp,
              challengeId,
            );

      const response = await fetch(PROFILE_PHONE_IDENTITY_PATH, {
        method: "POST",
        headers: { "content-type": PHONE_JSON_CONTENT_TYPE },
        body: JSON.stringify({
          challengeId,
          phoneNumber: normalized,
          accessToken,
        }),
      });
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(
          await readResponseJson(response),
        );
        setError(
          apiError.success
            ? apiError.data.error.message
            : PHONE_GENERIC_ERROR_MESSAGE,
        );
        return;
      }
      onConnected();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  if (awaitingOtp) {
    return (
      <form className="profile-connect-form" onSubmit={connect}>
        <div className={PHONE_CAPTCHA_CONTAINER_CLASS} id={captchaId} />
        <Field
          autoComplete="one-time-code"
          error={error}
          id="connect-phone-otp"
          inputMode="numeric"
          label={PHONE_OTP_INPUT_LABEL}
          onChange={(event) => setOtp(event.currentTarget.value)}
          placeholder={PHONE_OTP_INPUT_PLACEHOLDER}
          ref={otpInput}
          required
          value={otp}
        />
        <Button disabled={pending} type="submit" variant="primary">
          {pending ? PHONE_OTP_PENDING_LABEL : CONNECT_LABEL}
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            setChallengeId("");
            setError(undefined);
          }}
          type="button"
          variant="ghost"
        >
          {CANCEL_LABEL}
        </Button>
      </form>
    );
  }

  return (
    <form className="profile-connect-form" onSubmit={sendCode}>
      <div className={PHONE_CAPTCHA_CONTAINER_CLASS} id={captchaId} />
      <Field
        autoComplete="tel"
        error={error}
        id="connect-phone-number"
        inputMode="tel"
        label={PHONE_INPUT_LABEL}
        onChange={(event) => setPhoneNumber(event.currentTarget.value)}
        placeholder={PHONE_INPUT_PLACEHOLDER}
        required
        value={phoneNumber}
      />
      <Button disabled={pending} type="submit" variant="primary">
        {pending ? PHONE_PENDING_LABEL : SEND_LABEL}
      </Button>
    </form>
  );
}
