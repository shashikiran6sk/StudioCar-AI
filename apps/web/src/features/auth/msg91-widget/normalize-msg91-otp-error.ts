import {
  Msg91WidgetFailureSchema,
  Msg91WidgetTransportFailureSchema,
  type Msg91WidgetFailure,
} from "@studiocar/contracts";

import { createPhoneOtpError } from "../phone-otp-error/create-phone-otp-error";
import { PhoneOtpError } from "../phone-otp-error/phone-otp-error";
import { PhoneOtpErrorCategory } from "../phone-otp-error/phone-otp-error.types";
import {
  MSG91_CODE_CATEGORIES,
  MSG91_ERROR_TYPE,
  MSG91_FAIL_STATUS,
  MSG91_METHOD_OPERATIONS,
  MSG91_NUMERIC_CODE_PATTERN,
  MSG91_RETRY_AFTER_PATTERN,
} from "./msg91-otp-error.constants";
import type { Msg91WidgetMethod } from "./msg91-widget.types";

function readProviderCode(failure: Msg91WidgetFailure): number | undefined {
  const { code } = failure;
  if (typeof code === "number" && Number.isSafeInteger(code)) return code;
  if (typeof code === "string" && MSG91_NUMERIC_CODE_PATTERN.test(code.trim())) {
    return Number(code.trim());
  }
  return undefined;
}

function readRetryAfterSeconds(message: string | undefined): number | undefined {
  const seconds = Number(message?.match(MSG91_RETRY_AFTER_PATTERN)?.[1]);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}

function classify(
  method: Msg91WidgetMethod,
  failure: Msg91WidgetFailure,
  providerCode: number | undefined,
): PhoneOtpErrorCategory {
  if (providerCode !== undefined) {
    return (
      MSG91_CODE_CATEGORIES[method].get(providerCode) ??
      PhoneOtpErrorCategory.UnknownProviderError
    );
  }
  /**
   * No code: MSG91 refused the request's shape ("reqId is required.") or the
   * widget refused its own arguments. Either way the request was malformed.
   */
  if (
    failure.type === MSG91_ERROR_TYPE ||
    failure.status === MSG91_FAIL_STATUS ||
    failure.message !== undefined
  ) {
    return PhoneOtpErrorCategory.InvalidRequest;
  }
  return PhoneOtpErrorCategory.UnknownProviderError;
}

/**
 * Translates whatever the widget handed a failure callback into an
 * application error. The widget passes the provider's JSON body when MSG91
 * answered, a list of strings when the HTTP request itself failed, and throws
 * an `Error` when its own argument checks fail.
 */
export function normalizeMsg91OtpError(
  method: Msg91WidgetMethod,
  failure: unknown,
): PhoneOtpError {
  if (failure instanceof PhoneOtpError) return failure;

  const operation = MSG91_METHOD_OPERATIONS[method];
  if (Msg91WidgetTransportFailureSchema.safeParse(failure).success) {
    return createPhoneOtpError(PhoneOtpErrorCategory.NetworkError, operation);
  }
  if (failure instanceof Error) {
    return createPhoneOtpError(PhoneOtpErrorCategory.InvalidRequest, operation);
  }

  const parsed = Msg91WidgetFailureSchema.safeParse(failure);
  if (!parsed.success) {
    return createPhoneOtpError(
      PhoneOtpErrorCategory.UnknownProviderError,
      operation,
    );
  }

  const providerCode = readProviderCode(parsed.data);
  const category = classify(method, parsed.data, providerCode);
  const retryAfterSeconds =
    category === PhoneOtpErrorCategory.RateLimited
      ? readRetryAfterSeconds(parsed.data.message)
      : undefined;
  return createPhoneOtpError(category, operation, {
    providerCode,
    retryAfterSeconds,
  });
}
