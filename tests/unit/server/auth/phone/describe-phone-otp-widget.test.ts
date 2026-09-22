import { describe, expect, it } from "vitest";

import { describePhoneOtpWidget } from "../../../../../apps/web/src/server/auth/phone/describe-phone-otp-widget";
import { parsePhoneOtpWidgetEnvironment } from "../../../../../packages/config/src/environment";

const base = {};

describe("describePhoneOtpWidget", () => {
  it("publishes the widget id and public token for the msg91 driver", () => {
    const widget = describePhoneOtpWidget(
      parsePhoneOtpWidgetEnvironment({
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
      parsePhoneOtpWidgetEnvironment({
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
      parsePhoneOtpWidgetEnvironment({ ...base, PHONE_OTP_DRIVER: "fake" }),
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

describe("describePhoneOtpWidget configuration isolation", () => {
  it("needs no session secret or database url to describe the widget", () => {
    expect(() =>
      describePhoneOtpWidget(parsePhoneOtpWidgetEnvironment({})),
    ).not.toThrow();
  });

  it("reports the msg91 driver as unavailable when credentials are absent", () => {
    expect(
      describePhoneOtpWidget(
        parsePhoneOtpWidgetEnvironment({ PHONE_OTP_DRIVER: "msg91" }),
      ),
    ).toMatchObject({ enabled: false, driver: "msg91", widgetId: null });
  });
});
