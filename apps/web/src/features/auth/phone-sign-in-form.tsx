"use client";

import {
  ApiErrorSchema,
  PhoneAuthenticationStatus,
  PhoneStartResponseSchema,
  PhoneStartSchema,
  PhoneVerifyResponseSchema,
  PhoneVerifySchema,
  UpdateProfileSchema,
  type PhoneOtpWidget,
} from "@studiocar/contracts";
import { Button, ButtonLink, Field } from "@studiocar/ui";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  PHONE_AUTH_START_PATH,
  PHONE_AUTH_CREATE_ACCOUNT_PATH,
  PHONE_AUTH_VERIFY_PATH,
} from "../../app/app-routes";
import { createDevelopmentAccessToken } from "./create-development-access-token";
import { createGoogleAuthStartHref } from "./create-google-auth-start-href";
import { GOOGLE_PHONE_SETUP_CANCELLED_VALUE } from "../../server/auth/google/google-auth.constants";
import { PhoneAccountChoices } from "./phone-account-choices";
import { PhoneCreateAccountStep } from "./phone-create-account-step";
import { loadMsg91Widget } from "./msg91-widget/load-msg91-widget";
import { retryMsg91Otp } from "./msg91-widget/retry-msg91-otp";
import { sendMsg91Otp } from "./msg91-widget/send-msg91-otp";
import { verifyMsg91Otp } from "./msg91-widget/verify-msg91-otp";
import {
  PHONE_CAPTCHA_CONTAINER_CLASS,
  PHONE_CHANGE_NUMBER_LABEL,
  PHONE_DEVELOPMENT_NOTICE,
  PHONE_GENERIC_ERROR_MESSAGE,
  PHONE_INPUT_LABEL,
  PHONE_INPUT_PLACEHOLDER,
  PHONE_JSON_CONTENT_TYPE,
  PHONE_OTP_INPUT_LABEL,
  PHONE_OTP_INPUT_PLACEHOLDER,
  PHONE_OTP_PENDING_LABEL,
  PHONE_OTP_SENT_MESSAGE,
  PHONE_OTP_SUBMIT_LABEL,
  PHONE_PENDING_LABEL,
  PHONE_RESEND_LABEL,
  PHONE_RESEND_PENDING_LABEL,
  PHONE_SUBMIT_LABEL,
  PHONE_WIDGET_UNAVAILABLE_MESSAGE,
  PHONE_GOOGLE_BUTTON_LABEL,
  PHONE_GOOGLE_MARK,
  PHONE_AUTH_DIVIDER_LABEL,
  PHONE_OAUTH_CANCELLED_MESSAGE,
  PHONE_SIGNING_IN_MESSAGE,
  PHONE_ACCOUNT_REVERIFY_HTTP_STATUSES,
  PhoneSignInStage,
} from "./phone-sign-in.constants";
import { readResponseJson } from "./read-response-json";
import { requestPhoneOtpWidget } from "./request-phone-otp-widget";
import { toWidgetIdentifier } from "./to-widget-identifier";

export interface PhoneSignInFormProps {
  returnTo: string;
  initialVerifiedPhone?: string | null;
  phoneSetupError?: string | null;
}

export function PhoneSignInForm({
  returnTo,
  initialVerifiedPhone = null,
  phoneSetupError = null,
}: PhoneSignInFormProps) {
  const captchaId = useId();
  const [widget, setWidget] = useState<PhoneOtpWidget | null>(null);
  const [widgetResolved, setWidgetResolved] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalizedPhoneNumber, setNormalizedPhoneNumber] = useState("");
  const [stage, setStage] = useState(
    initialVerifiedPhone
      ? PhoneSignInStage.AccountChoices
      : PhoneSignInStage.EnterPhone,
  );
  const [displayName, setDisplayName] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>(
    phoneSetupError === GOOGLE_PHONE_SETUP_CANCELLED_VALUE
      ? PHONE_OAUTH_CANCELLED_MESSAGE
      : undefined,
  );
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const phoneInput = useRef<HTMLInputElement>(null);
  const otpInput = useRef<HTMLInputElement>(null);
  const awaitingOtp = stage === PhoneSignInStage.VerifyOtp;
  const verifiedPhoneNumber = initialVerifiedPhone ?? normalizedPhoneNumber;

  useEffect(() => {
    let active = true;
    void requestPhoneOtpWidget().then((resolved) => {
      if (!active) return;
      setWidget(resolved);
      setWidgetResolved(true);
    });
    return () => {
      active = false;
    };
  }, []);

  /**
   * A layout effect, so focus moves in the same commit that reveals the code
   * field. A passive effect runs in a later task, leaving a moment where the
   * field exists but a keyboard user's focus is still on the page body.
   */
  useLayoutEffect(() => {
    if (awaitingOtp) otpInput.current?.focus();
  }, [awaitingOtp]);

  const unavailable =
    widgetResolved && (widget === null || !widget.enabled);

  /**
   * The widget sends the message from the browser, so the application records
   * the challenge first: that is what applies the per-phone and per-IP limits
   * before any message can be spent.
   */
  async function reserveChallenge(normalized: string): Promise<string | null> {
    const response = await fetch(PHONE_AUTH_START_PATH, {
      method: "POST",
      headers: { "content-type": PHONE_JSON_CONTENT_TYPE },
      body: JSON.stringify({ phoneNumber: normalized }),
    });
    const payload = await readResponseJson(response);
    if (!response.ok) {
      const apiError = ApiErrorSchema.safeParse(payload);
      setError(
        apiError.success ? apiError.data.error.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
      return null;
    }
    const started = PhoneStartResponseSchema.safeParse(payload);
    if (!started.success) {
      setError(PHONE_GENERIC_ERROR_MESSAGE);
      return null;
    }
    return started.data.challengeId;
  }

  async function deliverOtp(normalized: string, resend: boolean): Promise<void> {
    if (!widget || widget.driver !== "msg91") return;
    await loadMsg91Widget({
      widgetId: widget.widgetId ?? "",
      tokenAuth: widget.tokenAuth ?? "",
      captchaRenderId: captchaId,
    });
    const identifier = toWidgetIdentifier(normalized);
    if (resend) await retryMsg91Otp(identifier);
    else await sendMsg91Otp(identifier);
  }

  async function startVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const input = PhoneStartSchema.safeParse({ phoneNumber });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? PHONE_GENERIC_ERROR_MESSAGE);
      phoneInput.current?.focus();
      return;
    }

    setPending(true);
    try {
      const reserved = await reserveChallenge(input.data.phoneNumber);
      if (!reserved) return;
      await deliverOtp(input.data.phoneNumber, false);
      setNormalizedPhoneNumber(input.data.phoneNumber);
      setChallengeId(reserved);
      setStage(PhoneSignInStage.VerifyOtp);
      setOtp("");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  async function resendOtp() {
    setError(undefined);
    setResending(true);
    try {
      const reserved = await reserveChallenge(normalizedPhoneNumber);
      if (!reserved) return;
      await deliverOtp(normalizedPhoneNumber, true);
      setChallengeId(reserved);
      setOtp("");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
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
              toWidgetIdentifier(normalizedPhoneNumber),
              otp,
              challengeId,
            );
      const input = PhoneVerifySchema.safeParse({
        challengeId,
        phoneNumber: normalizedPhoneNumber,
        accessToken,
      });
      if (!input.success) {
        setError(input.error.issues[0]?.message ?? PHONE_GENERIC_ERROR_MESSAGE);
        otpInput.current?.focus();
        return;
      }

      const response = await fetch(PHONE_AUTH_VERIFY_PATH, {
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
      const verified = PhoneVerifyResponseSchema.safeParse(payload);
      if (!verified.success) {
        setError(PHONE_GENERIC_ERROR_MESSAGE);
        return;
      }
      if (
        verified.data.status === PhoneAuthenticationStatus.AccountSetupRequired
      ) {
        setStage(PhoneSignInStage.AccountChoices);
        return;
      }
      setStage(PhoneSignInStage.Authenticated);
      window.location.assign(returnTo);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  function changePhoneNumber() {
    setStage(PhoneSignInStage.EnterPhone);
    setChallengeId("");
    setOtp("");
    setError(undefined);
    queueMicrotask(() => phoneInput.current?.focus());
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const input = UpdateProfileSchema.safeParse({ displayName });
    if (!input.success) {
      setError(input.error.issues[0]?.message ?? PHONE_GENERIC_ERROR_MESSAGE);
      return;
    }
    setPending(true);
    try {
      const response = await fetch(PHONE_AUTH_CREATE_ACCOUNT_PATH, {
        method: "POST",
        headers: { "content-type": PHONE_JSON_CONTENT_TYPE },
        body: JSON.stringify(input.data),
      });
      const payload = await readResponseJson(response);
      if (!response.ok) {
        const apiError = ApiErrorSchema.safeParse(payload);
        const message = apiError.success
          ? apiError.data.error.message
          : PHONE_GENERIC_ERROR_MESSAGE;
        if (PHONE_ACCOUNT_REVERIFY_HTTP_STATUSES.has(response.status)) {
          setStage(PhoneSignInStage.EnterPhone);
        }
        setError(message);
        return;
      }
      const created = PhoneVerifyResponseSchema.safeParse(payload);
      if (
        !created.success ||
        created.data.status !== PhoneAuthenticationStatus.Authenticated
      ) {
        setError(PHONE_GENERIC_ERROR_MESSAGE);
        return;
      }
      setStage(PhoneSignInStage.Authenticated);
      window.location.assign(returnTo);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : PHONE_GENERIC_ERROR_MESSAGE,
      );
    } finally {
      setPending(false);
    }
  }

  if (stage === PhoneSignInStage.AccountChoices) {
    return (
      <PhoneAccountChoices
        error={error}
        onCreate={() => {
          setError(undefined);
          setStage(PhoneSignInStage.CreateAccount);
        }}
        phoneNumber={verifiedPhoneNumber}
        returnTo={returnTo}
      />
    );
  }

  if (stage === PhoneSignInStage.CreateAccount) {
    return (
      <PhoneCreateAccountStep
        displayName={displayName}
        error={error}
        onBack={() => {
          setError(undefined);
          setStage(PhoneSignInStage.AccountChoices);
        }}
        onDisplayNameChange={setDisplayName}
        onSubmit={(event) => void createAccount(event)}
        pending={pending}
        phoneNumber={verifiedPhoneNumber}
      />
    );
  }

  if (stage === PhoneSignInStage.Authenticated) {
    return <p className="auth-form__notice" role="status">{PHONE_SIGNING_IN_MESSAGE}</p>;
  }

  if (awaitingOtp) {
    return (
      <form className="auth-form" onSubmit={verifyOtp}>
        <p className="auth-form__notice">
          {PHONE_OTP_SENT_MESSAGE} <strong>{normalizedPhoneNumber}</strong>.
        </p>
        {widget?.driver === "fake" ? (
          <p className="auth-form__notice">{PHONE_DEVELOPMENT_NOTICE}</p>
        ) : null}
        <div className={PHONE_CAPTCHA_CONTAINER_CLASS} id={captchaId} />
        <Field
          autoComplete="one-time-code"
          error={error}
          id="phone-otp"
          inputMode="numeric"
          label={PHONE_OTP_INPUT_LABEL}
          onChange={(event) => setOtp(event.currentTarget.value)}
          pattern="[0-9]*"
          placeholder={PHONE_OTP_INPUT_PLACEHOLDER}
          ref={otpInput}
          required
          value={otp}
        />
        <Button
          className="auth-form__submit"
          disabled={pending || resending}
          type="submit"
          variant="primary"
        >
          {pending ? PHONE_OTP_PENDING_LABEL : PHONE_OTP_SUBMIT_LABEL}
        </Button>
        <Button
          disabled={pending || resending}
          onClick={() => void resendOtp()}
          type="button"
          variant="ghost"
        >
          {resending ? PHONE_RESEND_PENDING_LABEL : PHONE_RESEND_LABEL}
        </Button>
        <Button
          disabled={pending || resending}
          onClick={changePhoneNumber}
          type="button"
          variant="ghost"
        >
          {PHONE_CHANGE_NUMBER_LABEL}
        </Button>
      </form>
    );
  }

  return (
    <>
      <ButtonLink
        className="auth-card__google"
        href={createGoogleAuthStartHref(returnTo)}
      >
        <span aria-hidden="true" className="auth-card__google-mark">
          {PHONE_GOOGLE_MARK}
        </span>
        {PHONE_GOOGLE_BUTTON_LABEL}
      </ButtonLink>
      <div className="auth-divider">
        <span>{PHONE_AUTH_DIVIDER_LABEL}</span>
      </div>
      {unavailable ? (
        <p className="auth-form__notice" role="status">
          {widget?.reason ?? PHONE_WIDGET_UNAVAILABLE_MESSAGE}
        </p>
      ) : (
        <form className="auth-form" onSubmit={startVerification}>
          <div className={PHONE_CAPTCHA_CONTAINER_CLASS} id={captchaId} />
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
          <Button
            className="auth-form__submit"
            disabled={pending || !widgetResolved}
            type="submit"
            variant="primary"
          >
            {pending ? PHONE_PENDING_LABEL : PHONE_SUBMIT_LABEL}
          </Button>
        </form>
      )}
    </>
  );
}
