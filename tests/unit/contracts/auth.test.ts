import { describe, expect, it } from "vitest";

import {
  GoogleAuthStartSchema,
  GoogleIdTokenClaimsSchema,
  GoogleOAuthCallbackSchema,
  GoogleOAuthChallengePayloadSchema,
  Msg91WidgetVerificationSchema,
  PhoneOtpWidgetSchema,
  PhoneAuthenticationStatus,
  PhoneStartSchema,
  PhoneStartResponseSchema,
  PhoneVerifySchema,
  PhoneVerifyResponseSchema,
} from "../../../packages/contracts/src/auth";

const oauthValue = "a".repeat(43);

describe("phone authentication contracts", () => {
  it("normalizes common Indian mobile formats to E.164", () => {
    expect(PhoneStartSchema.parse({ phoneNumber: "+91 98765 43210" })).toEqual({
      phoneNumber: "+919876543210",
    });
    expect(PhoneStartSchema.parse({ phoneNumber: "09876543210" })).toEqual({
      phoneNumber: "+919876543210",
    });
    expect(PhoneStartSchema.safeParse({ phoneNumber: "12345" }).success).toBe(false);
  });

  it("validates public start, verify, and MSG91 response envelopes", () => {
    expect(
      PhoneStartResponseSchema.safeParse({
        status: PhoneAuthenticationStatus.ChallengeSent,
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        expiresAt: "2026-09-18T12:10:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      PhoneVerifyResponseSchema.safeParse({
        status: PhoneAuthenticationStatus.Authenticated,
        user: {
          id: "user-1",
          displayName: null,
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      }).success,
    ).toBe(true);
    expect(
      PhoneVerifyResponseSchema.safeParse({
        status: PhoneAuthenticationStatus.AccountSetupRequired,
      }).success,
    ).toBe(true);
    expect(
      PhoneVerifyResponseSchema.safeParse({
        status: PhoneAuthenticationStatus.AccountSetupRequired,
        user: { id: "must-not-leak" },
      }).success,
    ).toBe(false);
    expect(
      Msg91WidgetVerificationSchema.parse({
        type: "SUCCESS",
        message: "919876543210",
        extra: true,
      }),
    ).toMatchObject({ type: "success", message: "919876543210" });
  });

  it("keeps verification tied to a challenge and a widget access token", () => {
    expect(
      PhoneVerifySchema.safeParse({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        phoneNumber: "+919876543210",
        accessToken: "signed.access.token",
      }).success,
    ).toBe(true);
    expect(
      PhoneVerifySchema.safeParse({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        phoneNumber: "+919876543210",
        accessToken: "",
      }).success,
    ).toBe(false);
    expect(
      PhoneVerifySchema.safeParse({
        challengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
        phoneNumber: "+919876543210",
        otp: "123456",
      }).success,
    ).toBe(false);
  });

  it("describes widget configuration without server credentials", () => {
    const widget = PhoneOtpWidgetSchema.parse({
      enabled: true,
      driver: "msg91",
      widgetId: "widget-id",
      tokenAuth: "widget-token",
      devCode: null,
      reason: null,
    });

    expect(Object.keys(widget)).not.toContain("authKey");
    expect(
      PhoneOtpWidgetSchema.safeParse({
        enabled: true,
        driver: "msg91",
        widgetId: "widget-id",
        tokenAuth: "widget-token",
        devCode: null,
        reason: null,
        authKey: "must-not-be-accepted",
      }).success,
    ).toBe(false);
  });
});

describe("Google authentication contracts", () => {
  it("allows one protected linking intent but never profile and phone together", () => {
    const base = { codeVerifier: oauthValue, nonce: oauthValue };
    expect(GoogleOAuthChallengePayloadSchema.safeParse({
      ...base,
      phoneChallengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
    }).success).toBe(true);
    expect(GoogleOAuthChallengePayloadSchema.safeParse({
      ...base,
      linkUserId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      phoneChallengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
    }).success).toBe(false);
  });

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
