import {
  PhoneOtpWidgetSchema,
  type PhoneOtpWidget,
} from "@studiocar/contracts";
import type { PhoneAuthEnvironment } from "@studiocar/config";

import { PHONE_OTP_WIDGET_DISABLED_REASON } from "./phone-auth.constants";

/**
 * Browser-safe widget configuration only. `MSG91_AUTH_KEY` is deliberately
 * absent and must stay absent: it is the credential that makes access-token
 * verification a server-to-server call.
 */
export function describePhoneOtpWidget(
  environment: PhoneAuthEnvironment,
): PhoneOtpWidget {
  if (environment.PHONE_OTP_DRIVER === "fake") {
    return PhoneOtpWidgetSchema.parse({
      enabled: true,
      driver: "fake",
      widgetId: null,
      tokenAuth: null,
      devCode: environment.PHONE_OTP_DEV_CODE,
      reason: null,
    });
  }

  const widgetId = environment.MSG91_WIDGET_ID;
  const tokenAuth = environment.MSG91_WIDGET_TOKEN;
  if (!widgetId || !tokenAuth) {
    return PhoneOtpWidgetSchema.parse({
      enabled: false,
      driver: "msg91",
      widgetId: null,
      tokenAuth: null,
      devCode: null,
      reason: PHONE_OTP_WIDGET_DISABLED_REASON,
    });
  }

  return PhoneOtpWidgetSchema.parse({
    enabled: true,
    driver: "msg91",
    widgetId,
    tokenAuth,
    devCode: null,
    reason: null,
  });
}
