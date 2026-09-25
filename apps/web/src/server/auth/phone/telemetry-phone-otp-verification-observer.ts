import {
  OperationalLogLevel,
  OperationalMetricUnit,
  OperationalTelemetry,
  type OperationalTelemetryPort,
} from "@studiocar/observability";

import {
  PHONE_OTP_REFUSAL_EVENT_NAME,
  PHONE_OTP_REFUSAL_METRIC_NAME,
  PHONE_OTP_REFUSAL_REASON_DIMENSION,
  PHONE_OTP_TELEMETRY_SERVICE,
} from "./phone-auth.constants";
import type {
  PhoneOtpRefusalReason,
  PhoneOtpVerificationObserver,
} from "./phone-auth.types";

/**
 * Writes one structured event per refused verification: the bounded reason
 * and a count, nothing else. The phone number, the access token, the auth key
 * and the session cookie are never part of the event.
 */
export class TelemetryPhoneOtpVerificationObserver
  implements PhoneOtpVerificationObserver
{
  public constructor(
    private readonly telemetry: OperationalTelemetryPort = new OperationalTelemetry(),
    private readonly now: () => number = Date.now,
  ) {}

  public verificationRefused(reason: PhoneOtpRefusalReason): void {
    this.telemetry.emit({
      eventName: PHONE_OTP_REFUSAL_EVENT_NAME,
      level: OperationalLogLevel.WARN,
      service: PHONE_OTP_TELEMETRY_SERVICE,
      timestampMilliseconds: this.now(),
      dimensions: { [PHONE_OTP_REFUSAL_REASON_DIMENSION]: reason },
      metrics: [
        {
          name: PHONE_OTP_REFUSAL_METRIC_NAME,
          unit: OperationalMetricUnit.COUNT,
          value: 1,
        },
      ],
    });
  }
}
