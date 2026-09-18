import {
  GoogleAuthStartSchema,
  type GoogleIdentity,
  type GoogleOAuthChallengePayload,
  GoogleIdentityResolutionStatus,
} from "@studiocar/contracts";

import { hashAuthSecret } from "../hash-auth-secret";
import type {
  GoogleIdentityProvider,
  GoogleIdentityStore,
  GoogleOAuthApplication,
  GoogleOAuthChallengeStore,
  GoogleOAuthPayloadProtector,
  SessionIssuer,
} from "./google-auth.types";

const MILLISECONDS_PER_SECOND = 1_000;
const CHALLENGE_TTL_ERROR_MESSAGE =
  "OAuth challenge TTL must be a positive safe integer.";

export enum GoogleOAuthCompletionErrorCode {
  ChallengeInvalid = "challenge_invalid",
  IdentityLinkRequired = "identity_link_required",
  ProviderFailed = "provider_failed",
}

export class GoogleOAuthCompletionError extends Error {
  public constructor(
    public readonly code: GoogleOAuthCompletionErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "GoogleOAuthCompletionError";
  }
}

export interface GoogleOAuthServiceOptions {
  challengeTtlSeconds: number;
  now?: () => Date;
}

export class GoogleOAuthService implements GoogleOAuthApplication {
  private readonly challengeTtlMs: number;
  private readonly now: () => Date;

  public constructor(
    private readonly challengeStore: GoogleOAuthChallengeStore,
    private readonly identityStore: GoogleIdentityStore,
    private readonly provider: GoogleIdentityProvider,
    private readonly protector: GoogleOAuthPayloadProtector,
    private readonly sessions: SessionIssuer,
    options: GoogleOAuthServiceOptions,
  ) {
    this.challengeTtlMs = options.challengeTtlSeconds * MILLISECONDS_PER_SECOND;
    this.now = options.now ?? (() => new Date());

    if (!Number.isSafeInteger(this.challengeTtlMs) || this.challengeTtlMs <= 0) {
      throw new RangeError(CHALLENGE_TTL_ERROR_MESSAGE);
    }
  }

  public async start(input: { returnTo: string }): Promise<{
    authorizationUrl: URL;
    state: string;
    expiresAt: Date;
  }> {
    const validatedInput = GoogleAuthStartSchema.parse(input);
    const authorizationRequest = await this.provider.createAuthorizationRequest();
    const expiresAt = new Date(this.now().getTime() + this.challengeTtlMs);
    const protectedPayload = this.protector.protect({
      codeVerifier: authorizationRequest.codeVerifier,
      nonce: authorizationRequest.nonce,
    });

    await this.challengeStore.create({
      stateHash: hashAuthSecret(authorizationRequest.state),
      protectedPayload,
      returnTo: validatedInput.returnTo,
      expiresAt,
    });

    return {
      authorizationUrl: authorizationRequest.authorizationUrl,
      state: authorizationRequest.state,
      expiresAt,
    };
  }

  public async complete(input: { callbackUrl: URL; state: string }) {
    const authenticatedAt = this.now();
    const challenge = await this.challengeStore.consume(
      hashAuthSecret(input.state),
      authenticatedAt,
    );

    if (!challenge) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.ChallengeInvalid,
      );
    }

    let payload: GoogleOAuthChallengePayload;
    try {
      payload = this.protector.unprotect(challenge.protectedPayload);
    } catch (error) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.ChallengeInvalid,
        { cause: error },
      );
    }

    let identity: GoogleIdentity;
    try {
      identity = await this.provider.exchangeAuthorizationCode(
        input.callbackUrl,
        payload,
        input.state,
      );
    } catch (error) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.ProviderFailed,
        { cause: error },
      );
    }

    const resolution = await this.identityStore.resolve(identity, authenticatedAt);

    if (resolution.status === GoogleIdentityResolutionStatus.LinkRequired) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.IdentityLinkRequired,
      );
    }

    const returnTo = GoogleAuthStartSchema.parse({
      returnTo: challenge.returnTo,
    }).returnTo;
    const issuedSession = await this.sessions.issue(resolution.user.id);

    return { issuedSession, returnTo };
  }
}
