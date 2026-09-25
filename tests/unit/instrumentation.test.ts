import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "../../apps/web/src/instrumentation";

afterEach(() => vi.unstubAllEnvs());

describe("billing runtime startup", () => {
  it("fails startup with a Test key in production", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    expect(register).toThrow(/production requires rzp_live_/);
  });

  it("accepts a Live key in production", () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    expect(register).not.toThrow();
  });
});
