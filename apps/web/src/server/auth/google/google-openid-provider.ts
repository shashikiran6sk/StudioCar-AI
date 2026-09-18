import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from "openid-client";

import type { GoogleOAuthChallengePayload } from "@studiocar/contracts";

import {
  GOOGLE_ISSUER,
  GOOGLE_OAUTH_RESPONSE_TYPE,
  GOOGLE_OIDC_SCOPE,
  GOOGLE_PKCE_METHOD,
} from "./google-auth.constants";
import type {
  GoogleAuthorizationRequest,
  GoogleIdentity,
  GoogleIdentityProvider,
} from "./google-auth.types";
import { validateGoogleIdTokenClaims } from "./google-id-token-claims";

export interface GoogleOpenIdProviderOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  now?: () => Date;
}

export class GoogleOpenIdProvider implements GoogleIdentityProvider {
  private readonly now: () => Date;
  private configuration: Promise<Configuration> | undefined;

  public constructor(private readonly options: GoogleOpenIdProviderOptions) {
    this.now = options.now ?? (() => new Date());
  }

  public async createAuthorizationRequest(): Promise<GoogleAuthorizationRequest> {
    const configuration = await this.getConfiguration();
    const state = randomState();
    const nonce = randomNonce();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const authorizationUrl = buildAuthorizationUrl(configuration, {
      response_type: GOOGLE_OAUTH_RESPONSE_TYPE,
      redirect_uri: this.options.redirectUri,
      scope: GOOGLE_OIDC_SCOPE,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: GOOGLE_PKCE_METHOD,
    });

    return { authorizationUrl, state, nonce, codeVerifier };
  }

  public async exchangeAuthorizationCode(
    callbackUrl: URL,
    challenge: GoogleOAuthChallengePayload,
    expectedState: string,
  ): Promise<GoogleIdentity> {
    const configuration = await this.getConfiguration();
    const tokens = await authorizationCodeGrant(configuration, callbackUrl, {
      expectedState,
      expectedNonce: challenge.nonce,
      pkceCodeVerifier: challenge.codeVerifier,
      idTokenExpected: true,
    });

    return validateGoogleIdTokenClaims(tokens.claims(), {
      issuer: GOOGLE_ISSUER,
      clientId: this.options.clientId,
      nonce: challenge.nonce,
      now: this.now(),
    });
  }

  private getConfiguration(): Promise<Configuration> {
    if (this.configuration) return this.configuration;

    const pendingConfiguration = discovery(
      new URL(GOOGLE_ISSUER),
      this.options.clientId,
      this.options.clientSecret,
    );
    this.configuration = pendingConfiguration;
    void pendingConfiguration.catch(() => {
      if (this.configuration === pendingConfiguration) {
        this.configuration = undefined;
      }
    });

    return pendingConfiguration;
  }
}
