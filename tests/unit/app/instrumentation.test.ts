import { afterEach, describe, expect, it, vi } from "vitest";

const { initializeErrorTracking } = vi.hoisted(() => ({
  initializeErrorTracking: vi.fn(),
}));
vi.mock("../../../packages/observability/src/index", () => ({ initializeErrorTracking }));

import { register } from "../../../apps/web/src/instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
  initializeErrorTracking.mockReset();
});

describe("billing runtime startup", () => {
  it("fails startup with a Test key in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    await expect(register()).rejects.toThrow(/production requires rzp_live_/);
  });

  it("accepts a Live key in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");
    await expect(register()).resolves.toBeUndefined();
  });

  it("initializes monitoring in the Node runtime after validating billing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_123");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret");
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook");

    await register();

    expect(initializeErrorTracking).toHaveBeenCalledOnce();
    expect(initializeErrorTracking).toHaveBeenCalledWith(process.env);
  });
});
