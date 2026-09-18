import { describe, expect, it } from "vitest";

import {
  GoogleAuthStartSchema,
  GoogleIdTokenClaimsSchema,
  GoogleOAuthCallbackSchema,
  GoogleOAuthChallengePayloadSchema,
  PhoneStartSchema,
  PhoneVerifySchema,
} from "../../../packages/contracts/src/auth";

const oauthValue = "a".repeat(43);

describe("phone authentication contracts", () => {
  it("requires a normalized Indian E.164 number", () => {
    expect(PhoneStartSchema.safeParse({ phoneNumber: "+919876543210" }).success).toBe(
      true,
    );
    expect(PhoneStartSchema.safeParse({ phoneNumber: "9876543210" }).success).toBe(
      false,
    );
  });

  it("keeps OTP verification tied to a challenge and numeric code", () => {
    expect(
      PhoneVerifySchema.safeParse({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        phoneNumber: "+919876543210",
        otp: "12ab56",
      }).success,
    ).toBe(false);
  });
});

describe("Google authentication contracts", () => {
  it("allows only application-relative return paths", () => {
    expect(GoogleAuthStartSchema.parse({})).toEqual({ returnTo: "/dashboard" });
    expect(
      GoogleAuthStartSchema.safeParse({ returnTo: "/inventory?status=READY" }).success,
    ).toBe(true);
    expect(
      GoogleAuthStartSchema.safeParse({ returnTo: "https://attacker.example" }).success,
    ).toBe(false);
    expect(GoogleAuthStartSchema.safeParse({ returnTo: "//attacker.example" }).success).toBe(
      false,
    );
  });

  it("separates successful callbacks from provider errors", () => {
    expect(
      GoogleOAuthCallbackSchema.safeParse({ code: "authorization-code", state: oauthValue })
        .success,
    ).toBe(true);
    expect(
      GoogleOAuthCallbackSchema.safeParse({ error: "access_denied", state: oauthValue })
        .success,
    ).toBe(true);
    expect(GoogleOAuthCallbackSchema.safeParse({ code: "missing-state" }).success).toBe(
      false,
    );
  });

  it("validates protected PKCE data and verified Google claims", () => {
    expect(
      GoogleOAuthChallengePayloadSchema.safeParse({
        codeVerifier: oauthValue,
        nonce: oauthValue,
      }).success,
    ).toBe(true);
    expect(
      GoogleIdTokenClaimsSchema.safeParse({
        iss: "https://accounts.google.com",
        sub: "google-subject",
        aud: "google-client",
        iat: 1_790_000_000,
        exp: 1_790_000_600,
        nonce: oauthValue,
        email: "Dealer@StudioCar.Test",
        email_verified: true,
      }).data,
    ).toMatchObject({ email: "dealer@studiocar.test" });
    expect(
      GoogleIdTokenClaimsSchema.safeParse({
        iss: "https://accounts.google.com",
        sub: "google-subject",
        aud: "google-client",
        iat: 1_790_000_000,
        exp: 1_790_000_600,
        nonce: oauthValue,
        email: "dealer@studiocar.test",
        email_verified: false,
      }).success,
    ).toBe(false);
  });
});
