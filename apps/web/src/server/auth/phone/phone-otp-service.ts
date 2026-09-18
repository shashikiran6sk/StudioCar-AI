import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpCompletionStatus,
  PhoneOtpVerificationClaimStatus,
  PhoneStartSchema,
  type PhoneStart,
  PhoneVerifySchema,
  type PhoneVerify,
} from "@studiocar/contracts";

import { hashAuthSecret } from "../hash-auth-secret";
import type { SensitiveIdentifierHasher } from "../hash-sensitive-identifier";
import {
  IP_IDENTIFIER_PREFIX,
  MILLISECONDS_PER_SECOND,
  PHONE_IDENTIFIER_PREFIX,
  PHONE_OTP_SEND_FAILURE_CODE,
} from "./phone-auth.constants";
import { createPhoneOtpBrowserBinding } from "./create-phone-otp-browser-binding";
import type {
  CompletedPhoneOtp,
  PhoneOtpApplication,
  PhoneOtpChallengeStore,
  PhoneOtpCompletionStore,
  PhoneOtpProvider,
  SessionPreparer,
  StartedPhoneOtp,
} from "./phone-auth.types";
import { PhoneOtpProviderVerificationStatus } from "./phone-auth.types";

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

    try {
      const sent = await this.provider.send(validated.phoneNumber);
      const recorded = await this.challenges.markSent(
        result.challenge.id,
        sent.providerRequestId,
        this.now(),
      );
      if (!recorded) {
        throw new PhoneOtpApplicationError(
          PhoneOtpApplicationErrorCode.ProviderUnavailable,
        );
      }
    } catch (error) {
      await this.challenges.markSendFailed(
        result.challenge.id,
        PHONE_OTP_SEND_FAILURE_CODE,
        this.now(),
      );
      if (error instanceof PhoneOtpApplicationError) throw error;
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.ProviderUnavailable,
        undefined,
        { cause: error },
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

    if (!claim.providerAlreadyVerified) {
      let verification: { status: PhoneOtpProviderVerificationStatus };
      try {
        verification = await this.provider.verify(claim.phoneNumber, validated.otp);
      } catch (error) {
        await this.challenges.recordProviderError(
          validated.challengeId,
          claim.attemptId,
          this.now(),
        );
        throw new PhoneOtpApplicationError(
          PhoneOtpApplicationErrorCode.ProviderUnavailable,
          undefined,
          { cause: error },
        );
      }

      if (verification.status === PhoneOtpProviderVerificationStatus.Invalid) {
        await this.challenges.recordInvalid(
          validated.challengeId,
          claim.attemptId,
          this.now(),
        );
        throw new PhoneOtpApplicationError(PhoneOtpApplicationErrorCode.InvalidOtp);
      }

      if (verification.status === PhoneOtpProviderVerificationStatus.Expired) {
        await this.challenges.recordExpired(
          validated.challengeId,
          claim.attemptId,
          this.now(),
        );
        throw new PhoneOtpApplicationError(PhoneOtpApplicationErrorCode.Expired);
      }
    }

    const providerRecorded = await this.challenges.recordProviderVerified(
      validated.challengeId,
      claim.attemptId,
      this.now(),
    );
    if (!providerRecorded) {
      throw new PhoneOtpApplicationError(
        PhoneOtpApplicationErrorCode.InvalidChallenge,
      );
    }

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
