import { describe, expect, it } from "vitest";

import { parseRazorpayEnvironment } from "../../../packages/config/src/razorpay-environment";

const base = {
  RAZORPAY_KEY_SECRET: "secret",
  RAZORPAY_WEBHOOK_SECRET: "webhook",
};

describe("Razorpay environment", () => {
  it.each([
    ["development", "rzp_test_123"],
    ["production", "rzp_live_123"],
    ["local", "rzp_test_123"],
  ])("accepts the matching %s key", (appEnv, key) => {
    expect(parseRazorpayEnvironment({ ...base, APP_ENV: appEnv, RAZORPAY_KEY_ID: key }).RAZORPAY_KEY_ID).toBe(key);
  });

  it.each([
    ["development", "rzp_live_123"],
    ["production", "rzp_test_123"],
    ["local", "rzp_live_123"],
  ])("rejects the mismatched %s key", (appEnv, key) => {
    expect(() => parseRazorpayEnvironment({ ...base, APP_ENV: appEnv, RAZORPAY_KEY_ID: key })).toThrow();
  });

  it.each(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"])("requires %s", (missing) => {
    const input = { ...base, APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123" };
    delete input[missing];
    expect(() => parseRazorpayEnvironment(input)).toThrow();
  });
});
