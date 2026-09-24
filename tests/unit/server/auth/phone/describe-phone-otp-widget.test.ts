import { describe, expect, it } from "vitest";

import { describePhoneOtpWidget } from "../../../../../apps/web/src/server/auth/phone/describe-phone-otp-widget";
import {
  parsePhoneOtpWidgetEnvironment,
  type PhoneOtpWidgetEnvironment,
} from "../../../../../packages/config/src/environment";

const base = { APP_ENV: "development" };

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
      parsePhoneOtpWidgetEnvironment({ APP_ENV: "local" }),
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
      describePhoneOtpWidget(
        parsePhoneOtpWidgetEnvironment({
          APP_ENV: "development",
          MSG91_WIDGET_ID: "widget-id",
          MSG91_WIDGET_TOKEN: "widget-token",
        }),
      ),
    ).not.toThrow();
  });

  it("refuses msg91 without widget credentials rather than hiding phone sign-in", () => {
    for (const appEnvironment of ["development", "production"]) {
      expect(() =>
        parsePhoneOtpWidgetEnvironment({ APP_ENV: appEnvironment }),
      ).toThrow(/MSG91_WIDGET_ID is required/);
    }
  });

  it("refuses the fake driver outside the local environment", () => {
    expect(() =>
      parsePhoneOtpWidgetEnvironment({
        APP_ENV: "development",
        PHONE_OTP_DRIVER: "fake",
      }),
    ).toThrow(/PHONE_OTP_DRIVER=fake is not allowed/);
  });

  it("still reports the widget unavailable if handed incomplete configuration", () => {
    const incomplete: PhoneOtpWidgetEnvironment = {
      APP_ENV: "local",
      PHONE_OTP_DRIVER: "msg91",
      PHONE_OTP_DEV_CODE: "1234",
    };

    expect(describePhoneOtpWidget(incomplete)).toMatchObject({
      enabled: false,
      driver: "msg91",
      widgetId: null,
    });
  });
});
