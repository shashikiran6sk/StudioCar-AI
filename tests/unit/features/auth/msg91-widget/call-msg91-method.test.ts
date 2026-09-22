import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callMsg91Method } from "../../../../../apps/web/src/features/auth/msg91-widget/call-msg91-method";

function exposeMethods(): void {
  window.sendOtp = vi.fn();
  window.retryOtp = vi.fn();
  window.verifyOtp = vi.fn();
}

beforeEach(() => {
  exposeMethods();
});

afterEach(() => {
  delete window.sendOtp;
  delete window.retryOtp;
  delete window.verifyOtp;
  vi.useRealTimers();
});

describe("callMsg91Method", () => {
  it("resolves with the value the widget reports", async () => {
    await expect(
      callMsg91Method<string>("sendOtp", (resolve) => {
        resolve("done");
      }),
    ).resolves.toBe("done");
  });

  it("rejects with the widget's own error", async () => {
    await expect(
      callMsg91Method<string>("verifyOtp", (_resolve, reject) => {
        reject(new Error("wrong code"));
      }),
    ).rejects.toThrow("wrong code");
  });

  it("wraps a non-error refusal in a usable message", async () => {
    await expect(
      callMsg91Method<string>("verifyOtp", (_resolve, reject) => {
        reject({ code: 400 });
      }),
    ).rejects.toThrow("The verification service is not available on this page.");
  });

  it("settles once even when the widget answers twice", async () => {
    await expect(
      callMsg91Method<string>("sendOtp", (resolve, reject) => {
        resolve("first");
        reject(new Error("late failure"));
      }),
    ).resolves.toBe("first");
  });

  it("gives up when the widget never answers", async () => {
    vi.useFakeTimers();
    const pending = callMsg91Method<string>("sendOtp", () => undefined, 500);
    const assertion = expect(pending).rejects.toThrow(
      "The verification service is not available on this page.",
    );
    await vi.advanceTimersByTimeAsync(600);
    await assertion;
  });

  it("refuses when the widget never exposed the method", async () => {
    delete window.verifyOtp;
    vi.useFakeTimers();
    const pending = callMsg91Method<string>("verifyOtp", () => undefined, 60_000);
    const assertion = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(16_000);
    await assertion;
  });

  it("surfaces an error thrown synchronously by the caller", async () => {
    await expect(
      callMsg91Method<string>("sendOtp", () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
