import type {
  AuthUser,
  GoogleAuthStart,
  GoogleIdentity,
  GoogleIdentityResolution,
  GoogleOAuthChallengePayload,
} from "@studiocar/contracts";

import type { IssuedSession } from "../session-service";

export interface GoogleAuthorizationRequest {
  authorizationUrl: URL;
  state: string;
  codeVerifier: string;
  nonce: string;
}

export type { GoogleIdentity, GoogleIdentityResolution };
export type GoogleIdentityUser = AuthUser;

export interface GoogleIdentityProvider {
  createAuthorizationRequest(): Promise<GoogleAuthorizationRequest>;
  exchangeAuthorizationCode(
    callbackUrl: URL,
    challenge: GoogleOAuthChallengePayload,
    expectedState: string,
  ): Promise<GoogleIdentity>;
}

export interface GoogleOAuthChallengeStore {
  create(command: {
    stateHash: string;
    protectedPayload: string;
    returnTo: string;
    expiresAt: Date;
  }): Promise<unknown>;
  consume(
    stateHash: string,
    consumedAt: Date,
  ): Promise<{ protectedPayload: string; returnTo: string } | null>;
}

export interface GoogleIdentityStore {
  resolve(identity: GoogleIdentity, authenticatedAt: Date): Promise<GoogleIdentityResolution>;
}

export interface GoogleOAuthPayloadProtector {
  protect(payload: GoogleOAuthChallengePayload): string;
  unprotect(value: string): GoogleOAuthChallengePayload;
}

export interface SessionIssuer {
  issue(userId: string): Promise<IssuedSession>;
}

export interface GoogleOAuthApplication {
  start(input: GoogleAuthStart): Promise<{
    authorizationUrl: URL;
    state: string;
    expiresAt: Date;
  }>;
  complete(input: {
    callbackUrl: URL;
    state: string;
  }): Promise<{ issuedSession: IssuedSession; returnTo: string }>;
}
