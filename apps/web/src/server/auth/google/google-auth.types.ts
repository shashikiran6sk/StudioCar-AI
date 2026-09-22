import type {
  AuthUser,
  GoogleAuthStart,
  IdentityLinkResult,
  LinkGoogleIdentityCommand,
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

export interface GoogleIdentityLinkStore {
  linkGoogle(command: LinkGoogleIdentityCommand): Promise<IdentityLinkResult>;
}

export interface GoogleOAuthPayloadProtector {
  protect(payload: GoogleOAuthChallengePayload): string;
  unprotect(value: string): GoogleOAuthChallengePayload;
}

/**
 * Evaluated after a Google identity is resolved, because only then is there
 * both a verified email and an internal user to grant the role to.
 */
export interface AdminBootstrapEvaluator {
  evaluate(
    userId: string,
    verifiedEmail: string,
    now: Date,
  ): Promise<unknown>;
}

export interface SessionIssuer {
  issue(userId: string): Promise<IssuedSession>;
}

/**
 * A callback either signs somebody in or connects Google to the account that
 * was already signed in. The two are deliberately distinct: a link issues no
 * new session, and a sign-in never silently attaches to an open session.
 */
export type GoogleOAuthCompletion =
  | { kind: "SIGNED_IN"; issuedSession: IssuedSession; returnTo: string }
  | { kind: "LINKED"; returnTo: string };

export interface GoogleOAuthApplication {
  start(
    input: GoogleAuthStart & { linkUserId?: string },
  ): Promise<{
    authorizationUrl: URL;
    state: string;
    expiresAt: Date;
  }>;
  complete(input: {
    callbackUrl: URL;
    state: string;
    sessionUserId: string | null;
  }): Promise<GoogleOAuthCompletion>;
}
