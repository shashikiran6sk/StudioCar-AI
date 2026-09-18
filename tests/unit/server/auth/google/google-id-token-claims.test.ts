import { describe, expect, it } from "vitest";

import { validateGoogleIdTokenClaims } from "../../../../../apps/web/src/server/auth/google/google-id-token-claims";

const now = new Date("2026-09-18T12:00:00.000Z");
const nonce = "n".repeat(43);
const validClaims = {
  iss: "https://accounts.google.com",
  sub: "google-subject",
  aud: "google-client",
  iat: Math.floor(now.getTime() / 1_000),
  exp: Math.floor(now.getTime() / 1_000) + 600,
  nonce,
  email: "Dealer@StudioCar.Test",
  email_verified: true,
  name: "Studio Dealer",
};

const expectations = {
  issuer: "https://accounts.google.com",
  clientId: "google-client",
  nonce,
  now,
};

describe("validateGoogleIdTokenClaims", () => {
  it("returns a normalized identity for verified claims", () => {
    expect(validateGoogleIdTokenClaims(validClaims, expectations)).toEqual({
      providerSubject: "google-subject",
      email: "dealer@studiocar.test",
      displayName: "Studio Dealer",
    });
  });

  it.each([
    [{ ...validClaims, iss: "https://attacker.example" }, "issuer"],
    [{ ...validClaims, aud: "another-client" }, "audience"],
    [{ ...validClaims, exp: Math.floor(now.getTime() / 1_000) - 61 }, "expiry"],
    [{ ...validClaims, nonce: "x".repeat(43) }, "nonce"],
    [{ ...validClaims, email_verified: false }, "email verification"],
  ])("rejects invalid %s claims", (claims) => {
    expect(() => validateGoogleIdTokenClaims(claims, expectations)).toThrow();
  });
});
