import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpCompletionStatus,
  PhoneOtpVerificationClaimStatus,
  PhoneStartSchema,
  type PhoneStart,
  PhoneVerifySchema,
  type PhoneVerify,
  LinkPhoneIdentitySchema,
  type IdentityLinkResult,
  type LinkPhoneIdentity,
} from "@studiocar/contracts";

import { hashAuthSecret } from "../hash-auth-secret";
import type { SensitiveIdentifierHasher } from "../hash-sensitive-identifier";
import {
  IP_IDENTIFIER_PREFIX,
  MILLISECONDS_PER_SECOND,
  PHONE_IDENTIFIER_PREFIX,
  PHONE_OTP_TOKEN_IDENTIFIER_PREFIX,
} from "./phone-auth.constants";
import { toProviderMsisdn } from "./to-provider-msisdn";
import { createPhoneOtpBrowserBinding } from "./create-phone-otp-browser-binding";
import type {
  CompletedPhoneOtp,
  PhoneOtpApplication,
  PhoneOtpChallengeStore,
  PhoneIdentityLinkStore,
  PhoneOtpCompletionStore,
  PhoneOtpProvider,
  SessionPreparer,
  StartedPhoneOtp,
} from "./phone-auth.types";
import { PhoneOtpIdentificationStatus } from "./phone-auth.types";

const INVALID_CONFIGURATION_MESSAGE =
  "Phone OTP configuration values must be positive safe integers.";

export enum PhoneOtpApplicationErrorCode {
  RateLimited = "rate_limited",
  InvalidChallenge = "invalid_challenge",
  InvalidOtp = "invalid_otp",
  Expired = "expired",
  TooManyAttempts = "too_many_attempts",
  IdentityLinkRequired = "identity_link_required",
  ProviderUnavailable = "provider_unavailable",
}

export class PhoneOtpApplicationError extends Error {
  public constructor(
    public readonly code: PhoneOtpApplicationErrorCode,
    public readonly retryAfterSeconds?: number,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "PhoneOtpApplicationError";
  }
}

export interface PhoneOtpServiceOptions {
  challengeTtlSeconds: number;
  rateLimitWindowSeconds: number;
  sendMaxPerPhone: number;
  sendMaxPerIp: number;
  verifyMaxPerChallenge: number;
  verifyMaxPerIp: number;
  now?: () => Date;
  generateBrowserBinding?: () => string;
}

export class PhoneOtpService implements PhoneOtpApplication {
  private readonly challengeTtlMs: number;
  private readonly rateLimitWindowMs: number;
  private readonly now: () => Date;
  private readonly generateBrowserBinding: () => string;

  public constructor(
    private readonly challenges: PhoneOtpChallengeStore,
    private readonly completions: PhoneOtpCompletionStore,
    private readonly links: PhoneIdentityLinkStore,
    private readonly provider: PhoneOtpProvider,
    private readonly sessions: SessionPreparer,
    private readonly identifierHasher: SensitiveIdentifierHasher,
    private readonly options: PhoneOtpServiceOptions,
  ) {
    this.challengeTtlMs = options.challengeTtlSeconds * MILLISECONDS_PER_SECOND;
    this.rateLimitWindowMs =
      options.rateLimitWindowSeconds * MILLISECONDS_PER_SECOND;
    this.now = options.now ?? (() => new Date());
    this.generateBrowserBinding =
      options.generateBrowserBinding ?? createPhoneOtpBrowserBinding;

    const numericValues = [
      this.challengeTtlMs,
      this.rateLimitWindowMs,
      options.sendMaxPerPhone,
      options.sendMaxPerIp,
      options.verifyMaxPerChallenge,
      options.verifyMaxPerIp,
    ];
    if (
      numericValues.some(
        (value) => !Number.isSafeInteger(value) || value <= 0,
      )
    ) {
      throw new RangeError(INVALID_CONFIGURATION_MESSAGE);
    }
  }

  public async start(
    input: PhoneStart,
    clientAddress: string,
  ): Promise<StartedPhoneOtp> {
    const validated = PhoneStartSchema.parse(input);
    const now = this.now();
    const expiresAt = new Date(now.getTime() + this.challengeTtlMs);
    const browserBinding = this.generateBrowserBinding();
    const result = await this.challenges.createRateLimited({
      phoneNumber: validated.phoneNumber,
      phoneHash: this.identifierHasher.hash(
        `${PHONE_IDENTIFIER_PREFIX}${validated.phoneNumber}`,
      ),
      browserBindingHash: hashAuthSecret(browserBinding),
      requestIpHash: this.identifierHasher.hash(
        `${IP_IDENTIFIER_PREFIX}${clientAddress}`,
      ),
      now,
      expiresAt,
      windowStart: new Date(now.getTime() - this.rateLimitWindowMs),
      maxPerPhone: this.options.sendMaxPerPhone,
      maxPerIp: this.options.sendMaxPerIp,
    });

    if (result.status === PhoneOtpChallengeCreationStatus.RateLimited) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.RateLimited,
        this.retryAfterSeconds(result.retryAt, now),
      );
    }

    /**
     * The widget sends the message from the browser, so this records that the
     * challenge was authorised rather than that a provider accepted a send.
     */
    const recorded = await this.challenges.markSent(
      result.challenge.id,
      null,
      this.now(),
    );
    if (!recorded) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.InvalidChallenge,
      );
    }

    return {
      challengeId: result.challenge.id,
      expiresAt: result.challenge.expiresAt,
      browserBinding,
    };
  }

  public async verify(
    input: PhoneVerify,
    browserBinding: string,
    clientAddress: string,
  ): Promise<CompletedPhoneOtp> {
    const validated = PhoneVerifySchema.parse(input);
    const claim = await this.proveNumber(validated, browserBinding, clientAddress);

    const prepared = this.sessions.prepareIssue();
    const completion = await this.completions.complete({
      challengeId: validated.challengeId,
      attemptId: claim.attemptId,
      phoneNumber: claim.phoneNumber,
      browserBindingHash: hashAuthSecret(browserBinding),
      tokenHash: prepared.tokenHash,
      sessionExpiresAt: prepared.expiresAt,
      authenticatedAt: this.now(),
    });

    if (completion.status === PhoneOtpCompletionStatus.LinkRequired) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.IdentityLinkRequired,
      );
    }
    if (completion.status === PhoneOtpCompletionStatus.InvalidChallenge) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.InvalidChallenge,
      );
    }

    return {
      token: prepared.token,
      expiresAt: prepared.expiresAt,
      session: completion.session,
      user: completion.session.user,
    };
  }

  public async link(
    userId: string,
    input: LinkPhoneIdentity,
    browserBinding: string,
    clientAddress: string,
  ): Promise<IdentityLinkResult> {
    const validated = LinkPhoneIdentitySchema.parse(input);
    const claim = await this.proveNumber(validated, browserBinding, clientAddress);

    return this.links.linkPhone({
      userId,
      phoneNumber: claim.phoneNumber,
      linkedAt: this.now(),
    });
  }

  /**
   * Everything that establishes the person holds this handset: the browser-bound
   * rate-limited challenge, the provider's verdict on the access token, the
   * assertion that the token names the claimed number, and the single-use claim
   * of that token. Shared so linking and signing in cannot diverge.
   */
  private async proveNumber(
    validated: PhoneVerify | LinkPhoneIdentity,
    browserBinding: string,
    clientAddress: string,
  ): Promise<{ attemptId: string; phoneNumber: string }> {
    const now = this.now();
    const claim = await this.challenges.claimVerification({
      challengeId: validated.challengeId,
      phoneNumber: validated.phoneNumber,
      browserBindingHash: hashAuthSecret(browserBinding),
      requestIpHash: this.identifierHasher.hash(
        `${IP_IDENTIFIER_PREFIX}${clientAddress}`,
      ),
      now,
      windowStart: new Date(now.getTime() - this.rateLimitWindowMs),
      maxAttempts: this.options.verifyMaxPerChallenge,
      maxPerIp: this.options.verifyMaxPerIp,
    });

    if (claim.status !== PhoneOtpVerificationClaimStatus.Claimed) {
      this.throwClaimError(claim, now);
    }

    const identification = await this.provider.identify(validated.accessToken);

    if (identification.status === PhoneOtpIdentificationStatus.Unavailable) {
      await this.challenges.recordProviderError(
        validated.challengeId,
        claim.attemptId,
        this.now(),
      );
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.ProviderUnavailable,
      );
    }

    /**
     * The claimed number is the assertion being checked, never trusted input.
     * A token that proves a different handset is refused with the same answer
     * as a rejected token, so the response reveals nothing about whose number
     * a token belongs to.
     */
    const claimedIdentifier = toProviderMsisdn(claim.phoneNumber);
    if (
      identification.status === PhoneOtpIdentificationStatus.Rejected ||
      claimedIdentifier === null ||
      identification.identifier !== claimedIdentifier
    ) {
      await this.challenges.recordInvalid(
        validated.challengeId,
        claim.attemptId,
        this.now(),
      );
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.InvalidOtp,
      );
    }

    /**
     * Claiming the token hash is what stops a verified access token being
     * replayed against a second challenge; the unique index decides the race.
     */
    const providerRecorded = await this.challenges.recordProviderVerified(
      validated.challengeId,
      claim.attemptId,
      this.identifierHasher.hash(
        `${PHONE_OTP_TOKEN_IDENTIFIER_PREFIX}${validated.accessToken}`,
      ),
      this.now(),
    );
    if (!providerRecorded) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.InvalidOtp,
      );
    }

    return { attemptId: claim.attemptId, phoneNumber: claim.phoneNumber };
  }

  private throwClaimError(
    claim: Exclude<
      Awaited<ReturnType<PhoneOtpChallengeStore["claimVerification"]>>,
      { status: PhoneOtpVerificationClaimStatus.Claimed }
    >,
    now: Date,
  ): never {
    if (claim.status === PhoneOtpVerificationClaimStatus.RateLimited) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.RateLimited,
        this.retryAfterSeconds(claim.retryAt, now),
      );
    }
    if (claim.status === PhoneOtpVerificationClaimStatus.TooManyAttempts) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.TooManyAttempts,
      );
    }
    if (claim.status === PhoneOtpVerificationClaimStatus.Expired) {
      throw new PhoneOtpApplicationError(PhoneOtpApplicationErrorCode.Expired);
    }
    throw new PhoneOtpApplicationError(
      PhoneOtpApplicationErrorCode.InvalidChallenge,
    );
  }

  private retryAfterSeconds(retryAt: Date, now: Date): number {
    return Math.max(
      1,
      Math.ceil((retryAt.getTime() - now.getTime()) / MILLISECONDS_PER_SECOND),
    );
  }
}
