import {
  Msg91WidgetFailureSchema,
  Msg91WidgetTransportFailureSchema,
} from "@studiocar/contracts";

import type { PhoneOtpError } from "../phone-otp-error/phone-otp-error";
import { MSG91_OTP_FAILURE_LOG_MESSAGE } from "./msg91-widget.constants";
import type { Msg91WidgetMethod } from "./msg91-widget.types";

export interface Msg91OtpFailureLogEntry {
  method: Msg91WidgetMethod;
  category: string;
  providerCode: number | null;
  providerType: string | null;
  providerStatus: string | null;
  providerMessage: string | null;
  transportFailure: boolean;
  requestId: string | null;
}

export type Msg91OtpFailureLogSink = (
  message: string,
  entry: Msg91OtpFailureLogEntry,
) => void;

const defaultSink: Msg91OtpFailureLogSink = (message, entry) => {
  console.warn(message, entry);
};

/**
 * Development-only diagnostics for widget refusals. Only the provider's
 * classification fields are copied out of the failure — never the code the
 * person typed, an access token, or the widget token — and nothing is logged
 * in a production build.
 */
export function logMsg91OtpFailure(
  method: Msg91WidgetMethod,
  error: PhoneOtpError,
  failure: unknown,
  requestId: string | null,
  sink: Msg91OtpFailureLogSink = defaultSink,
  isProduction: boolean = process.env.NODE_ENV === "production",
): void {
  if (isProduction) return;
  const parsed = Msg91WidgetFailureSchema.safeParse(failure);
  const fields = parsed.success && !Array.isArray(failure) ? parsed.data : {};
  sink(MSG91_OTP_FAILURE_LOG_MESSAGE, {
    method,
    category: error.category,
    providerCode: error.providerCode ?? null,
    providerType: fields.type ?? null,
    providerStatus: fields.status ?? null,
    providerMessage: fields.message ?? null,
    transportFailure: Msg91WidgetTransportFailureSchema.safeParse(failure)
      .success,
    requestId,
  });
}
