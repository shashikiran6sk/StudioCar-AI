import {
  calculatePKCECodeChallenge,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";

import {
  GoogleIdentitySchema,
  type GoogleOAuthChallengePayload,
} from "@studiocar/contracts";

import {
  FAKE_GOOGLE_CALLBACK_REJECTED_MESSAGE,
  GOOGLE_OAUTH_CODE_QUERY_KEY,
  GOOGLE_OAUTH_STATE_QUERY_KEY,
  LOCAL_GOOGLE_IDENTITY,
} from "./google-auth.constants";
import type {
  GoogleAuthorizationRequest,
  GoogleIdentity,
  GoogleIdentityProvider,
} from "./google-auth.types";

export interface FakeGoogleIdentityProviderOptions {
  redirectUri: string;
}

/**
 * The Local environment's Google driver. Instead of sending the browser to
 * Google it sends it straight back to the application's own callback with an
 * authorization code bound to the one-time challenge, exactly as an identity
 * provider would bind it to the PKCE verifier. The challenge store, browser
 * state cookie, identity resolution, and session issuance all run unchanged.
 *
 * Only the Local profile can select it; environment validation refuses it
 * everywhere else.
 */
export class FakeGoogleIdentityProvider implements GoogleIdentityProvider {
  public constructor(
    private readonly options: FakeGoogleIdentityProviderOptions,
  ) {}

  public async createAuthorizationRequest(): Promise<GoogleAuthorizationRequest> {
    const state = randomState();
    const nonce = randomNonce();
    const codeVerifier = randomPKCECodeVerifier();
    const authorizationUrl = new URL(this.options.redirectUri);
    authorizationUrl.searchParams.set(
      GOOGLE_OAUTH_CODE_QUERY_KEY,
      await calculatePKCECodeChallenge(codeVerifier),
    );
    authorizationUrl.searchParams.set(GOOGLE_OAUTH_STATE_QUERY_KEY, state);

    return { authorizationUrl, state, nonce, codeVerifier };
  }

  public async exchangeAuthorizationCode(
    callbackUrl: URL,
    challenge: GoogleOAuthChallengePayload,
    expectedState: string,
  ): Promise<GoogleIdentity> {
    const state = callbackUrl.searchParams.get(GOOGLE_OAUTH_STATE_QUERY_KEY);
    const code = callbackUrl.searchParams.get(GOOGLE_OAUTH_CODE_QUERY_KEY);
    const expectedCode = await calculatePKCECodeChallenge(
      challenge.codeVerifier,
    );

    if (state !== expectedState || code !== expectedCode) {
      throw new Error(FAKE_GOOGLE_CALLBACK_REJECTED_MESSAGE);
    }

    return GoogleIdentitySchema.parse(LOCAL_GOOGLE_IDENTITY);
  }
}
