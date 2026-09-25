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
import { isCompleteOtpCode } from "./is-complete-otp-code";
import { maskPhoneNumber } from "./mask-phone-number";
import { loadMsg91Widget } from "./msg91-widget/load-msg91-widget";
import type { Msg91WidgetSettings } from "./msg91-widget/msg91-widget.types";
import { readMsg91WidgetSettings } from "./msg91-widget/read-msg91-widget-settings";
import { retryMsg91Otp } from "./msg91-widget/retry-msg91-otp";
import { sendMsg91Otp } from "./msg91-widget/send-msg91-otp";
import { verifyMsg91Otp } from "./msg91-widget/verify-msg91-otp";
import { createPhoneOtpError } from "./phone-otp-error/create-phone-otp-error";
import { PhoneOtpError } from "./phone-otp-error/phone-otp-error";
import {
  PHONE_OTP_AVAILABILITY_CATEGORIES,
  PHONE_OTP_TERMINAL_CATEGORIES,
} from "./phone-otp-error/phone-otp-error.constants";
import {
  PhoneOtpErrorCategory,
  PhoneOtpOperation,
} from "./phone-otp-error/phone-otp-error.types";
import { PhoneOtpStep } from "./phone-otp-step";
import {
  PHONE_CAPTCHA_CONTAINER_CLASS,
  PHONE_GENERIC_ERROR_MESSAGE,
  PHONE_INPUT_LABEL,
  PHONE_INPUT_PLACEHOLDER,
  PHONE_JSON_CONTENT_TYPE,
  PHONE_OTP_FALLBACK_MAX_LENGTH,
  PHONE_OTP_FORMAT_MESSAGE,
  PHONE_OTP_RESENT_MESSAGE,
  PHONE_PENDING_LABEL,
  PHONE_RESEND_FALLBACK_COOLDOWN_SECONDS,
  PHONE_SUBMIT_LABEL,
  PHONE_WIDGET_UNAVAILABLE_MESSAGE,
  PHONE_GOOGLE_BUTTON_LABEL,
  PHONE_GOOGLE_MARK,
  PHONE_AUTH_DIVIDER_LABEL,
  PHONE_OAUTH_CANCELLED_MESSAGE,
  PHONE_SIGNING_IN_MESSAGE,
  PHONE_ACCOUNT_REVERIFY_HTTP_STATUSES,
  PHONE_OTP_RETRYABLE_HTTP_STATUSES,
  PhoneSignInStage,
} from "./phone-sign-in.constants";
import { readResponseJson } from "./read-response-json";
import { requestPhoneOtpWidget } from "./request-phone-otp-widget";
import { toOtpDigits } from "./to-otp-digits";
import { toWidgetIdentifier } from "./to-widget-identifier";
import { useCountdown } from "./use-countdown";

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
  const [notice, setNotice] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  /** The provider's id for the current verification request (`reqId`). */
  const [requestId, setRequestId] = useState<string | null>(null);
  /** The provider will not accept another code for the current request. */
  const [requestSpent, setRequestSpent] = useState(false);
  const [widgetSettings, setWidgetSettings] =
    useState<Msg91WidgetSettings | null>(null);
  const [resendCountdown, startResendCountdown] = useCountdown();
  const verifying = useRef(false);
  const phoneInput = useRef<HTMLInputElement>(null);
  const otpInput = useRef<HTMLInputElement>(null);
  const awaitingOtp = stage === PhoneSignInStage.VerifyOtp;
  const verifiedPhoneNumber = initialVerifiedPhone ?? normalizedPhoneNumber;
  const usesMsg91 = widget?.driver === "msg91";
  const codeLength = usesMsg91
    ? (widgetSettings?.otpLength ?? null)
    : (widget?.devCode?.length ?? null);
  const canVerify =
    isCompleteOtpCode(otp, codeLength) && !(usesMsg91 && requestSpent);

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

  async function prepareMsg91Widget(
    active: PhoneOtpWidget,
    operation: PhoneOtpOperation,
  ): Promise<Msg91WidgetSettings> {
    try {
      await loadMsg91Widget({
        widgetId: active.widgetId ?? "",
        tokenAuth: active.tokenAuth ?? "",
        captchaRenderId: captchaId,
      });
    } catch {
      throw createPhoneOtpError(
        PhoneOtpErrorCategory.ServiceUnavailable,
        operation,
      );
    }
    return widgetSettings ?? readMsg91WidgetSettings();
  }

  /**
   * The resend pause follows the provider's own resend delay whenever the
   * widget reports it; StudioCar's fallback applies only when it does not.
   */
  function restartResendCountdown(settings: Msg91WidgetSettings | null) {
    startResendCountdown(
      settings?.resendDelaySeconds ?? PHONE_RESEND_FALLBACK_COOLDOWN_SECONDS,
    );
  }

  function focusOtpInput() {
    otpInput.current?.focus();
  }

  /**
   * Shows a normalized failure. A refused code is cleared so another can be
   * typed; a code that failed only because the service was unreachable is
   * kept so the person can simply try again.
   */
  function showFailure(failure: unknown) {
    if (!(failure instanceof PhoneOtpError)) {
      setError(PHONE_GENERIC_ERROR_MESSAGE);
      return;
    }
    setError(failure.message);
    if (PHONE_OTP_TERMINAL_CATEGORIES.has(failure.category)) {
      setRequestSpent(true);
    }
    if (
      failure.category === PhoneOtpErrorCategory.RateLimited &&
      failure.retryAfterSeconds !== undefined
    ) {
      startResendCountdown(failure.retryAfterSeconds);
    }
    if (
      failure.operation === PhoneOtpOperation.Verify &&
      !PHONE_OTP_AVAILABILITY_CATEGORIES.has(failure.category)
    ) {
      setOtp("");
      focusOtpInput();
    }
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
      let settings: Msg91WidgetSettings | null = null;
      if (widget?.driver === "msg91") {
        await prepareMsg91Widget(widget, PhoneOtpOperation.Send);
        const sentRequestId = await sendMsg91Otp(
          toWidgetIdentifier(input.data.phoneNumber),
        );
        settings = readMsg91WidgetSettings();
        setRequestId(sentRequestId);
        setWidgetSettings(settings);
      }
      setRequestSpent(false);
      setNotice(undefined);
      setNormalizedPhoneNumber(input.data.phoneNumber);
      setChallengeId(reserved);
      setStage(PhoneSignInStage.VerifyOtp);
      setOtp("");
      restartResendCountdown(settings);
    } catch (failure) {
      showFailure(failure);
    } finally {
      setPending(false);
    }
  }

  /**
   * Resends through MSG91's `retryOtp` for the current request. Only when that
   * request can no longer be verified (expired, locked after too many wrong
   * codes, or unknown to the provider), or the widget has no resend channel,
   * does a resend start a new request instead.
   */
  async function resendOtp() {
    setError(undefined);
    setNotice(undefined);
    setResending(true);
    try {
      const reserved = await reserveChallenge(normalizedPhoneNumber);
      if (!reserved) return;
      /**
       * Reserving replaced the browser-binding cookie, so the new challenge is
       * the one this browser can verify against even if the resend fails.
       */
      setChallengeId(reserved);
      let settings: Msg91WidgetSettings | null = null;
      if (widget?.driver === "msg91") {
        settings = await prepareMsg91Widget(widget, PhoneOtpOperation.Resend);
        const nextRequestId =
          !requestSpent && settings.canRetry
            ? await retryMsg91Otp(requestId, settings.retryChannel)
            : await sendMsg91Otp(toWidgetIdentifier(normalizedPhoneNumber));
        setRequestId(nextRequestId);
      }
      setRequestSpent(false);
      setOtp("");
      setNotice(PHONE_OTP_RESENT_MESSAGE);
      restartResendCountdown(settings);
      focusOtpInput();
    } catch (failure) {
      showFailure(failure);
    } finally {
      setResending(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /**
     * A ref, not state: two clicks or Enter presses in the same frame both
     * see stale state, but only one can pass this guard.
     */
    if (verifying.current) return;
    setError(undefined);
    setNotice(undefined);
    if (!widget) {
      setError(PHONE_WIDGET_UNAVAILABLE_MESSAGE);
      return;
    }
    if (!isCompleteOtpCode(otp, codeLength)) {
      setError(PHONE_OTP_FORMAT_MESSAGE);
      focusOtpInput();
      return;
    }
    if (!canVerify) return;

    verifying.current = true;
    setPending(true);
    try {
      const accessToken =
        widget.driver === "msg91"
          ? await verifyMsg91Otp(otp, requestId)
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
        if (PHONE_OTP_RETRYABLE_HTTP_STATUSES.has(response.status)) {
          setOtp("");
          focusOtpInput();
        }
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
      showFailure(failure);
    } finally {
      verifying.current = false;
      setPending(false);
    }
  }

  function changePhoneNumber() {
    setStage(PhoneSignInStage.EnterPhone);
    setChallengeId("");
    setOtp("");
    setError(undefined);
    setNotice(undefined);
    setRequestId(null);
    setRequestSpent(false);
    startResendCountdown(0);
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
      <PhoneOtpStep
        canVerify={canVerify}
        captchaId={captchaId}
        code={otp}
        codeLength={codeLength}
        developmentMode={widget?.driver === "fake"}
        error={error}
        maskedPhoneNumber={maskPhoneNumber(normalizedPhoneNumber)}
        notice={notice}
        onChangeNumber={changePhoneNumber}
        onCodeChange={(value) => {
          setOtp(
            toOtpDigits(value, codeLength ?? PHONE_OTP_FALLBACK_MAX_LENGTH),
          );
        }}
        onResend={() => void resendOtp()}
        onSubmit={(event) => void verifyOtp(event)}
        pending={pending}
        ref={otpInput}
        resendCountdownSeconds={resendCountdown}
        resending={resending}
      />
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
