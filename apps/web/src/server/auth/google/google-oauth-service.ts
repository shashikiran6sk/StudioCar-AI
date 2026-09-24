import {
  GoogleAuthStartSchema,
  type GoogleIdentity,
  type GoogleOAuthChallengePayload,
  GoogleIdentityResolutionStatus,
  IdentityLinkStatus,
} from "@studiocar/contracts";

import { hashAuthSecret } from "../hash-auth-secret";
import type { PhoneAccountRepositoryPort } from "../phone/phone-account.types";
import type {
  AdminBootstrapEvaluator,
  GoogleIdentityLinkStore,
  GoogleIdentityProvider,
  GoogleIdentityStore,
  GoogleOAuthApplication,
  GoogleOAuthChallengeStore,
  GoogleOAuthCompletion,
  GoogleOAuthPayloadProtector,
  SessionIssuer,
  VerifiedPhoneGoogleStore,
} from "./google-auth.types";

const MILLISECONDS_PER_SECOND = 1_000;
const CHALLENGE_TTL_ERROR_MESSAGE =
  "OAuth challenge TTL must be a positive safe integer.";

export enum GoogleOAuthCompletionErrorCode {
  ChallengeInvalid = "challenge_invalid",
  IdentityLinkRequired = "identity_link_required",
  ProviderFailed = "provider_failed",
  /** The link was started by a session that is no longer the one completing it. */
  LinkSessionMismatch = "link_session_mismatch",
  /** The Google account already belongs to somebody else. */
  LinkIdentityTaken = "link_identity_taken",
  VerifiedPhoneExpired = "verified_phone_expired",
  PhoneIdentityTaken = "phone_identity_taken",
  GoogleIdentityConflict = "google_identity_conflict",
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
    private readonly linkStore: GoogleIdentityLinkStore,
    private readonly provider: GoogleIdentityProvider,
    private readonly protector: GoogleOAuthPayloadProtector,
    private readonly sessions: SessionIssuer,
    private readonly adminBootstrap: AdminBootstrapEvaluator,
    private readonly phoneAccounts: Pick<PhoneAccountRepositoryPort, "findVerified">,
    private readonly phoneGoogle: VerifiedPhoneGoogleStore,
    options: GoogleOAuthServiceOptions,
  ) {
    this.challengeTtlMs = options.challengeTtlSeconds * MILLISECONDS_PER_SECOND;
    this.now = options.now ?? (() => new Date());

    if (!Number.isSafeInteger(this.challengeTtlMs) || this.challengeTtlMs <= 0) {
      throw new RangeError(CHALLENGE_TTL_ERROR_MESSAGE);
    }
  }

  public async start(input: {
    returnTo: string;
    linkUserId?: string;
    verifiedPhone?: { challengeId: string; browserBinding: string };
  }): Promise<{
    authorizationUrl: URL;
    state: string;
    expiresAt: Date;
  }> {
    const validatedInput = GoogleAuthStartSchema.parse({
      returnTo: input.returnTo,
    });
    const authorizationRequest = await this.provider.createAuthorizationRequest();
    const expiresAt = new Date(this.now().getTime() + this.challengeTtlMs);
    if (input.verifiedPhone) {
      const verified = await this.phoneAccounts.findVerified({
        challengeId: input.verifiedPhone.challengeId,
        browserBindingHash: hashAuthSecret(input.verifiedPhone.browserBinding),
        now: this.now(),
      });
      if (!verified) {
        throw new GoogleOAuthCompletionError(
          GoogleOAuthCompletionErrorCode.VerifiedPhoneExpired,
        );
      }
    }
    /**
     * The link intent lives inside the encrypted, one-time challenge rather
     * than the URL, so it cannot be forged or pointed at another account.
     */
    const protectedPayload = this.protector.protect({
      codeVerifier: authorizationRequest.codeVerifier,
      nonce: authorizationRequest.nonce,
      ...(input.linkUserId === undefined
        ? {}
        : { linkUserId: input.linkUserId }),
      ...(input.verifiedPhone === undefined
        ? {}
        : { phoneChallengeId: input.verifiedPhone.challengeId }),
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

  public async complete(input: {
    callbackUrl: URL;
    state: string;
    sessionUserId: string | null;
    phoneBrowserBinding?: string | null;
  }): Promise<GoogleOAuthCompletion> {
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

    const returnTo = GoogleAuthStartSchema.parse({
      returnTo: challenge.returnTo,
    }).returnTo;

    if (payload.linkUserId !== undefined) {
      return this.completeLink(
        payload.linkUserId,
        identity,
        input.sessionUserId,
        authenticatedAt,
        returnTo,
      );
    }

    if (payload.phoneChallengeId !== undefined) {
      const browserBinding = input.phoneBrowserBinding;
      if (!browserBinding) {
        throw new GoogleOAuthCompletionError(
          GoogleOAuthCompletionErrorCode.VerifiedPhoneExpired,
        );
      }
      const prepared = this.sessions.prepareIssue();
      const resolution = await this.phoneGoogle.resolve({
        challengeId: payload.phoneChallengeId,
        browserBindingHash: hashAuthSecret(browserBinding),
        identity,
        authenticatedAt,
        session: prepared,
      });
      if (resolution.kind !== "RESOLVED") {
        const code =
          resolution.kind === "INVALID_VERIFICATION"
            ? GoogleOAuthCompletionErrorCode.VerifiedPhoneExpired
            : resolution.kind === "PHONE_TAKEN"
              ? GoogleOAuthCompletionErrorCode.PhoneIdentityTaken
              : GoogleOAuthCompletionErrorCode.GoogleIdentityConflict;
        throw new GoogleOAuthCompletionError(code);
      }
      return {
        kind: "PHONE_LINKED_SIGNED_IN",
        issuedSession: {
          token: prepared.token,
          expiresAt: prepared.expiresAt,
          session: resolution.session,
        },
        returnTo,
      };
    }

    const resolution = await this.identityStore.resolve(identity, authenticatedAt);

    if (resolution.status === GoogleIdentityResolutionStatus.LinkRequired) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.IdentityLinkRequired,
      );
    }

    await this.bootstrapAdministrator(
      resolution.user.id,
      identity.email,
      authenticatedAt,
    );
    const issuedSession = await this.sessions.issue(resolution.user.id);

    return { kind: "SIGNED_IN", issuedSession, returnTo };
  }

  private async completeLink(
    linkUserId: string,
    identity: GoogleIdentity,
    sessionUserId: string | null,
    linkedAt: Date,
    returnTo: string,
  ): Promise<GoogleOAuthCompletion> {
    /**
     * The browser completing the callback must still be the account that asked
     * for the link. Without this, a link challenge could be finished by a
     * different session and attach a Google account to the wrong user.
     */
    if (sessionUserId === null || sessionUserId !== linkUserId) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.LinkSessionMismatch,
      );
    }

    const result = await this.linkStore.linkGoogle({
      userId: linkUserId,
      providerSubject: identity.providerSubject,
      email: identity.email,
      displayName: identity.displayName,
      linkedAt,
    });

    if (
      result.status === IdentityLinkStatus.IdentityTaken ||
      result.status === IdentityLinkStatus.ContactTaken
    ) {
      throw new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.LinkIdentityTaken,
      );
    }

    await this.bootstrapAdministrator(linkUserId, identity.email, linkedAt);

    return { kind: "LINKED", returnTo };
  }

  /**
   * Bootstrap must never be the reason a sign-in fails. The role is a
   * convenience the deployment configured; authentication is what the person
   * actually asked for.
   */
  private async bootstrapAdministrator(
    userId: string,
    verifiedEmail: string,
    now: Date,
  ): Promise<void> {
    try {
      await this.adminBootstrap.evaluate(userId, verifiedEmail, now);
    } catch {
      // Intentionally ignored; see above.
    }
  }
}
