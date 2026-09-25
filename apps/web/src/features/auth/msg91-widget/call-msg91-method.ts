import { createPhoneOtpError } from "../phone-otp-error/create-phone-otp-error";
import { PhoneOtpErrorCategory } from "../phone-otp-error/phone-otp-error.types";
import { MSG91_WIDGET_CALL_TIMEOUT_MS } from "./msg91-widget.constants";
import { MSG91_METHOD_OPERATIONS } from "./msg91-otp-error.constants";
import type { Msg91WidgetMethod } from "./msg91-widget.types";
import { whenMsg91WidgetExposed } from "./load-msg91-widget";
import { logMsg91OtpFailure } from "./log-msg91-otp-failure";
import { normalizeMsg91OtpError } from "./normalize-msg91-otp-error";

export interface CallMsg91MethodOptions {
  timeoutMs?: number;
  /** The provider request id, recorded with any failure for correlation. */
  requestId?: string | null;
}

/**
 * The widget answers through callbacks that may never fire when a domain is
 * not allow-listed, so every call is bounded and settles exactly once.
 *
 * Every refusal is normalized into a `PhoneOtpError`. Only a call that never
 * got an answer — the widget did not start, or did not respond in time — is
 * reported as the service being unavailable; a provider that answered "wrong
 * code" is never described as an outage.
 */
export function callMsg91Method<T>(
  method: Msg91WidgetMethod,
  run: (
    resolve: (value: T) => void,
    reject: (error: unknown) => void,
  ) => void,
  options: CallMsg91MethodOptions = {},
): Promise<T> {
  const operation = MSG91_METHOD_OPERATIONS[method];
  const unavailable = () =>
    createPhoneOtpError(PhoneOtpErrorCategory.ServiceUnavailable, operation);

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const settle = <A>(act: (value: A) => void) => (value: A) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      act(value);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(unavailable());
    }, options.timeoutMs ?? MSG91_WIDGET_CALL_TIMEOUT_MS);

    const succeed = settle(resolve);
    const refuse = settle<unknown>((failure) => {
      const error = normalizeMsg91OtpError(method, failure);
      logMsg91OtpFailure(method, error, failure, options.requestId ?? null);
      reject(error);
    });
    const giveUp = settle<unknown>(() => {
      reject(unavailable());
    });

    whenMsg91WidgetExposed().then(() => {
      if (typeof window[method] !== "function") {
        giveUp(undefined);
        return;
      }
      try {
        run(succeed, refuse);
      } catch (error) {
        refuse(error);
      }
    }, giveUp);
  });
}
