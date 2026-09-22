import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpVerificationClaimStatus,
  type ClaimPhoneOtpVerificationCommand,
  type ClaimPhoneOtpVerificationResult,
  type CreatePhoneOtpChallengeCommand,
  type CreatePhoneOtpChallengeResult,
} from "@studiocar/contracts";

import type { PrismaClient } from "@studiocar/database-runtime";
import { PhoneOtpAttemptOutcome } from "@studiocar/database-runtime";

const PHONE_RATE_LIMIT_LOCK_PREFIX = "phone-otp-send-phone:";
const IP_RATE_LIMIT_LOCK_PREFIX = "phone-otp-send-ip:";
const CHALLENGE_LOCK_PREFIX = "phone-otp-challenge:";
const VERIFY_IP_LOCK_PREFIX = "phone-otp-verify-ip:";

function retryAt(oldestCreatedAt: Date | null, now: Date, windowStart: Date): Date {
  const windowMilliseconds = now.getTime() - windowStart.getTime();
  return new Date((oldestCreatedAt ?? now).getTime() + windowMilliseconds);
}

export class PrismaPhoneOtpChallengeRepository {
  public constructor(private readonly database: PrismaClient) {}

  public createRateLimited(
    command: CreatePhoneOtpChallengeCommand,
  ): Promise<CreatePhoneOtpChallengeResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${PHONE_RATE_LIMIT_LOCK_PREFIX}${command.phoneHash}`}, 0))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${IP_RATE_LIMIT_LOCK_PREFIX}${command.requestIpHash}`}, 0))`;

      const phoneWindow = await transaction.phoneOtpChallenge.aggregate({
        where: {
          phoneHash: command.phoneHash,
          createdAt: { gte: command.windowStart },
        },
        _count: true,
        _min: { createdAt: true },
      });

      if (phoneWindow._count >= command.maxPerPhone) {
        return {
          status: PhoneOtpChallengeCreationStatus.RateLimited,
          retryAt: retryAt(phoneWindow._min.createdAt, command.now, command.windowStart),
        };
      }

      const ipWindow = await transaction.phoneOtpChallenge.aggregate({
        where: {
          sendRequestIpHash: command.requestIpHash,
          createdAt: { gte: command.windowStart },
        },
        _count: true,
        _min: { createdAt: true },
      });

      if (ipWindow._count >= command.maxPerIp) {
        return {
          status: PhoneOtpChallengeCreationStatus.RateLimited,
          retryAt: retryAt(ipWindow._min.createdAt, command.now, command.windowStart),
        };
      }

      const challenge = await transaction.phoneOtpChallenge.create({
        data: {
          phoneNumber: command.phoneNumber,
          phoneHash: command.phoneHash,
          browserBindingHash: command.browserBindingHash,
          sendRequestIpHash: command.requestIpHash,
          expiresAt: command.expiresAt,
        },
        select: { id: true, expiresAt: true },
      });

      return { status: PhoneOtpChallengeCreationStatus.Created, challenge };
    });
  }

  public async markSent(
    challengeId: string,
    providerRequestId: string | null,
    sentAt: Date,
  ): Promise<boolean> {
    const result = await this.database.phoneOtpChallenge.updateMany({
      where: { id: challengeId, sentAt: null, failedAt: null },
      data: { providerRequestId, sentAt },
    });
    return result.count === 1;
  }

  public async markSendFailed(
    challengeId: string,
    failureCode: string,
    failedAt: Date,
  ): Promise<boolean> {
    const result = await this.database.phoneOtpChallenge.updateMany({
      where: { id: challengeId, sentAt: null, failedAt: null },
      data: { failureCode, failedAt },
    });
    return result.count === 1;
  }

  public claimVerification(
    command: ClaimPhoneOtpVerificationCommand,
  ): Promise<ClaimPhoneOtpVerificationResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${CHALLENGE_LOCK_PREFIX}${command.challengeId}`}, 0))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${VERIFY_IP_LOCK_PREFIX}${command.requestIpHash}`}, 0))`;

      const challenge = await transaction.phoneOtpChallenge.findFirst({
        where: {
          id: command.challengeId,
          phoneNumber: command.phoneNumber,
          browserBindingHash: command.browserBindingHash,
          sentAt: { not: null },
          failedAt: null,
          consumedAt: null,
        },
        select: {
          phoneNumber: true,
          expiresAt: true,
          verificationAttempts: true,
          providerVerifiedAt: true,
        },
      });

      if (!challenge) {
        return { status: PhoneOtpVerificationClaimStatus.InvalidChallenge };
      }

      if (challenge.expiresAt <= command.now) {
        return { status: PhoneOtpVerificationClaimStatus.Expired };
      }

      if (challenge.verificationAttempts >= command.maxAttempts) {
        return { status: PhoneOtpVerificationClaimStatus.TooManyAttempts };
      }

      const ipWindow = await transaction.phoneOtpAttempt.aggregate({
        where: {
          requestIpHash: command.requestIpHash,
          createdAt: { gte: command.windowStart },
        },
        _count: true,
        _min: { createdAt: true },
      });

      if (ipWindow._count >= command.maxPerIp) {
        return {
          status: PhoneOtpVerificationClaimStatus.RateLimited,
          retryAt: retryAt(ipWindow._min.createdAt, command.now, command.windowStart),
        };
      }

      const attempt = await transaction.phoneOtpAttempt.create({
        data: {
          challengeId: command.challengeId,
          requestIpHash: command.requestIpHash,
        },
        select: { id: true },
      });
      await transaction.phoneOtpChallenge.update({
        where: { id: command.challengeId },
        data: { verificationAttempts: { increment: 1 } },
      });

      return {
        status: PhoneOtpVerificationClaimStatus.Claimed,
        attemptId: attempt.id,
        phoneNumber: challenge.phoneNumber,
        providerAlreadyVerified: challenge.providerVerifiedAt !== null,
      };
    });
  }

  public recordInvalid(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean> {
    return this.recordProviderOutcome(
      challengeId,
      attemptId,
      PhoneOtpAttemptOutcome.INVALID,
      completedAt,
    );
  }

  public recordExpired(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean> {
    return this.recordProviderOutcome(
      challengeId,
      attemptId,
      PhoneOtpAttemptOutcome.EXPIRED,
      completedAt,
    );
  }

  public recordProviderVerified(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean> {
    return this.recordProviderOutcome(
      challengeId,
      attemptId,
      PhoneOtpAttemptOutcome.PROVIDER_VERIFIED,
      completedAt,
    );
  }

  public recordProviderError(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean> {
    return this.recordProviderOutcome(
      challengeId,
      attemptId,
      PhoneOtpAttemptOutcome.PROVIDER_ERROR,
      completedAt,
    );
  }

  private async recordProviderOutcome(
    challengeId: string,
    attemptId: string,
    outcome: PhoneOtpAttemptOutcome,
    completedAt: Date,
  ): Promise<boolean> {
    return this.database.$transaction(async (transaction) => {
      const attempt = await transaction.phoneOtpAttempt.updateMany({
        where: {
          id: attemptId,
          challengeId,
          outcome: PhoneOtpAttemptOutcome.PENDING,
        },
        data: { outcome, completedAt },
      });

      if (attempt.count !== 1) return false;

      if (outcome === PhoneOtpAttemptOutcome.PROVIDER_VERIFIED) {
        await transaction.phoneOtpChallenge.updateMany({
          where: { id: challengeId, providerVerifiedAt: null, consumedAt: null },
          data: { providerVerifiedAt: completedAt },
        });
      }

      return true;
    });
  }
}
