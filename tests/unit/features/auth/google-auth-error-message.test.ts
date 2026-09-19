import { describe, expect, it } from "vitest";

import { googleAuthErrorMessage } from "../../../../apps/web/src/features/auth/google-auth-error-message";

describe("googleAuthErrorMessage", () => {
  it.each([
    ["access_denied", "Google sign-in was cancelled."],
    [
      "challenge_invalid",
      "That sign-in attempt expired or was already used. Please try again.",
    ],
    [
      "identity_link_required",
      "That email already belongs to an account. Sign in another way before linking Google.",
    ],
  ])("maps %s to a safe message", (code, message) => {
    expect(googleAuthErrorMessage(code)).toBe(message);
  });

  it("does not expose an unknown provider error", () => {
    expect(googleAuthErrorMessage("provider_secret_detail")).toBe(
      "We could not complete Google sign-in. Please try again.",
    );
  });
});
