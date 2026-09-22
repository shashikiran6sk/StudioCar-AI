import { describe, expect, it } from "vitest";

import { describePhoneOtpWidget } from "../../../../../apps/web/src/server/auth/phone/describe-phone-otp-widget";
import { parsePhoneAuthEnvironment } from "../../../../../packages/config/src/environment";

const base = {
  DATABASE_URL: "postgresql://studiocar:secret@localhost:5432/studiocar",
  SESSION_SECRET: "s".repeat(32),
};

describe("describePhoneOtpWidget", () => {
  it("publishes the widget id and public token for the msg91 driver", () => {
    const widget = describePhoneOtpWidget(
      parsePhoneAuthEnvironment({
        ...base,
        PHONE_OTP_DRIVER: "msg91",
        MSG91_AUTH_KEY: "server-only-auth-key",
        MSG91_WIDGET_ID: "widget-id",
        MSG91_WIDGET_TOKEN: "widget-token",
      }),
    );

    expect(widget).toEqual({
      enabled: true,
      driver: "msg91",
      widgetId: "widget-id",
      tokenAuth: "widget-token",
      devCode: null,
      reason: null,
    });
  });

  it("never exposes the server auth key to the browser", () => {
    const widget = describePhoneOtpWidget(
      parsePhoneAuthEnvironment({
        ...base,
        PHONE_OTP_DRIVER: "msg91",
        MSG91_AUTH_KEY: "server-only-auth-key",
        MSG91_WIDGET_ID: "widget-id",
        MSG91_WIDGET_TOKEN: "widget-token",
      }),
    );

    expect(JSON.stringify(widget)).not.toContain("server-only-auth-key");
  });

  it("describes the development driver with its accepted code", () => {
    const widget = describePhoneOtpWidget(
      parsePhoneAuthEnvironment({ ...base, PHONE_OTP_DRIVER: "fake" }),
    );

    expect(widget).toEqual({
      enabled: true,
      driver: "fake",
      widgetId: null,
      tokenAuth: null,
      devCode: "1234",
      reason: null,
    });
  });
});
