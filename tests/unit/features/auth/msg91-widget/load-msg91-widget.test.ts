import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadMsg91Widget,
  resetMsg91Widget,
  whenMsg91WidgetExposed,
} from "../../../../../apps/web/src/features/auth/msg91-widget/load-msg91-widget";

const credentials = { widgetId: "widget-id", tokenAuth: "widget-token" };

function exposeMethods(): void {
  window.sendOtp = vi.fn();
  window.retryOtp = vi.fn();
  window.verifyOtp = vi.fn();
}

function clearMethods(): void {
  delete window.initSendOTP;
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
}

beforeEach(() => {
  resetMsg91Widget();
  clearMethods();
  document.head.innerHTML = "";
});

afterEach(() => {
  clearMethods();
  vi.restoreAllMocks();
});

describe("loadMsg91Widget", () => {
  it("injects the provider script once and initialises with exposed methods", async () => {
    window.initSendOTP = vi.fn(() => {
      exposeMethods();
    });
    const pending = loadMsg91Widget({ ...credentials, captchaRenderId: "c1" });
    const script = document.getElementById("msg91-otp-provider");
    expect(script).not.toBeNull();
    script?.dispatchEvent(new Event("load"));
    // jsdom does not run onload handlers for injected scripts.
    const element = script as HTMLScriptElement | null;
    element?.onload?.(new Event("load"));

    await expect(pending).resolves.toBeUndefined();
    expect(window.initSendOTP).toHaveBeenCalledWith(
      expect.objectContaining({
        widgetId: "widget-id",
        tokenAuth: "widget-token",
        exposeMethods: true,
        captchaRenderId: "c1",
      }),
    );
  });

  it("loads the provider script from the MSG91 verify origin", () => {
    window.initSendOTP = vi.fn(() => {
      exposeMethods();
    });
    void loadMsg91Widget(credentials);

    const script = document.getElementById("msg91-otp-provider");
    expect(script?.getAttribute("src")).toBe(
      "https://verify.msg91.com/otp-provider.js",
    );
  });

  it("omits the captcha container when none is supplied", async () => {
    window.initSendOTP = vi.fn(() => {
      exposeMethods();
    });
    const pending = loadMsg91Widget(credentials);
    const element = document.getElementById(
      "msg91-otp-provider",
    ) as HTMLScriptElement | null;
    element?.onload?.(new Event("load"));
    await pending;

    const configuration = vi.mocked(window.initSendOTP).mock.calls[0]?.[0];
    expect(configuration).not.toHaveProperty("captchaRenderId");
  });

  it("rejects and allows a retry when the script fails to load", async () => {
    const pending = loadMsg91Widget(credentials);
    const element = document.getElementById(
      "msg91-otp-provider",
    ) as HTMLScriptElement | null;
    element?.onerror?.(new Event("error"));

    await expect(pending).rejects.toThrow(
      "The verification service could not be loaded.",
    );
    expect(document.getElementById("msg91-otp-provider")).toBeNull();
  });
});

describe("whenMsg91WidgetExposed", () => {
  it("resolves once every driving method is attached", async () => {
    exposeMethods();
    await expect(whenMsg91WidgetExposed()).resolves.toBeUndefined();
  });

  it("explains that the domain may not be allow-listed", async () => {
    vi.useFakeTimers();
    const pending = whenMsg91WidgetExposed();
    const assertion = expect(pending).rejects.toThrow(/allow-listed/);
    await vi.advanceTimersByTimeAsync(16_000);
    await assertion;
    vi.useRealTimers();
  });
});
