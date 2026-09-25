import { afterEach, describe, expect, it } from "vitest";

import { readMsg91WidgetSettings } from "../../../../../apps/web/src/features/auth/msg91-widget/read-msg91-widget-settings";

/** The shape `getWidgetData()` returns, trimmed from the live widget. */
function widgetData(overrides: Record<string, unknown> = {}) {
  return {
    widgetType: { value: "2", name: "Custom" },
    otpLength: 6,
    retryTime: 60,
    expiryTime: 15,
    processes: [
      { processVia: { value: 2 }, channel: { value: 11, name: "SMS" } },
      { processVia: { value: 5 }, channel: { value: "12", name: "WHATSAPP" } },
      { processVia: { value: 5 }, channel: { value: "11", name: "SMS" } },
    ],
    ...overrides,
  };
}

afterEach(() => {
  delete window.getWidgetData;
});

describe("readMsg91WidgetSettings", () => {
  it("reads code length, resend delay and SMS resend for a Custom widget", () => {
    window.getWidgetData = () => widgetData();

    expect(readMsg91WidgetSettings()).toEqual({
      otpLength: 6,
      resendDelaySeconds: 60,
      retryChannel: "11",
      canRetry: true,
    });
  });

  it("falls back to the first resend channel when SMS is not one", () => {
    window.getWidgetData = () =>
      widgetData({
        processes: [
          { processVia: { value: "5" }, channel: { value: "4", name: "VOICE" } },
        ],
      });

    expect(readMsg91WidgetSettings().retryChannel).toBe("4");
  });

  it("cannot resend on a Custom widget without a resend process", () => {
    window.getWidgetData = () => widgetData({ processes: [] });

    expect(readMsg91WidgetSettings()).toMatchObject({
      retryChannel: null,
      canRetry: false,
    });
  });

  it("uses the default channel for a Default widget", () => {
    window.getWidgetData = () => widgetData({ widgetType: { value: "1" } });

    expect(readMsg91WidgetSettings()).toMatchObject({
      retryChannel: null,
      canRetry: true,
    });
  });

  it("reports nothing it was not told", () => {
    expect(readMsg91WidgetSettings()).toEqual({
      otpLength: null,
      resendDelaySeconds: null,
      retryChannel: null,
      canRetry: true,
    });

    window.getWidgetData = () => {
      throw new Error("not ready");
    };
    expect(readMsg91WidgetSettings().otpLength).toBeNull();
  });
});
