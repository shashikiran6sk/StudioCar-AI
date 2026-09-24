import { describe, expect, it } from "vitest";

import {
  OAuthChallengeProtectionError,
  OAuthChallengeProtector,
} from "../../../../apps/web/src/server/auth/oauth-challenge-protector";

const payload = {
  codeVerifier: "v".repeat(43),
  nonce: "n".repeat(43),
};

describe("OAuthChallengeProtector", () => {
  it("round-trips authenticated encrypted challenge data", () => {
    const protector = new OAuthChallengeProtector("s".repeat(32));
    const protectedValue = protector.protect(payload);

    expect(protectedValue).not.toContain(payload.codeVerifier);
    expect(protectedValue).not.toContain(payload.nonce);
    expect(protector.unprotect(protectedValue)).toEqual(payload);
  });

  it("protects the verified-phone intent without exposing its challenge ID", () => {
    const protector = new OAuthChallengeProtector("s".repeat(32));
    const phoneChallengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
    const protectedValue = protector.protect({ ...payload, phoneChallengeId });
    expect(protectedValue).not.toContain(phoneChallengeId);
    expect(protector.unprotect(protectedValue)).toEqual({
      ...payload,
      phoneChallengeId,
    });
  });

  it("rejects tampering and undersized secrets", () => {
    const protector = new OAuthChallengeProtector("s".repeat(32));
    const protectedValue = protector.protect(payload);
    const tamperedValue = protectedValue.replace(
      /\.[^.]+$/,
      `.${"A".repeat(22)}`,
    );

    expect(() => protector.unprotect(tamperedValue)).toThrow(
      OAuthChallengeProtectionError,
    );
    expect(() => new OAuthChallengeProtector("too-short")).toThrow(RangeError);
  });
});
