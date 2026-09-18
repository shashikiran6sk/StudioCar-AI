import {
  GoogleIdTokenClaimsSchema,
  type GoogleIdTokenClaims,
} from "@studiocar/contracts";

import type { GoogleIdentity } from "./google-auth.types";

const CLOCK_TOLERANCE_SECONDS = 60;
const CLAIMS_VERIFICATION_ERROR_MESSAGE =
  "Google ID token claims failed verification.";

export interface GoogleIdTokenExpectations {
  issuer: string;
  clientId: string;
  nonce: string;
  now: Date;
}

export function validateGoogleIdTokenClaims(
  value: unknown,
  expectations: GoogleIdTokenExpectations,
): GoogleIdentity {
  const claims: GoogleIdTokenClaims = GoogleIdTokenClaimsSchema.parse(value);
  const nowInSeconds = Math.floor(expectations.now.getTime() / 1_000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (
    claims.iss !== expectations.issuer ||
    !audiences.includes(expectations.clientId) ||
    claims.exp <= nowInSeconds - CLOCK_TOLERANCE_SECONDS ||
    claims.iat > nowInSeconds + CLOCK_TOLERANCE_SECONDS ||
    claims.nonce !== expectations.nonce
  ) {
    throw new Error(CLAIMS_VERIFICATION_ERROR_MESSAGE);
  }

  return {
    providerSubject: claims.sub,
    email: claims.email,
    displayName: claims.name ?? null,
  };
}
