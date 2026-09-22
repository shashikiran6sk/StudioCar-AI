import {
  PhoneOtpCompletionStatus,
  type AuthUser,
  type CompletePhoneOtpCommand,
  type PhoneOtpCompletionResult,
} from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import { AuthProvider, PhoneOtpAttemptOutcome } from "@studiocar/database-runtime";

const CHALLENGE_LOCK_PREFIX = "phone-otp-complete-challenge:";
const PHONE_IDENTITY_LOCK_PREFIX = "phone-identity:";

const authenticatedUserSelect = {
  id: true,
  displayName: true,
  primaryEmail: true,
  primaryPhone: true,
} satisfies Prisma.UserSelect;

const sessionSelect = {
  id: true,
  userId: true,
  expiresAt: true,
  user: { select: authenticatedUserSelect },
} satisfies Prisma.SessionSelect;

export class PrismaPhoneOtpCompletionRepository {
  public constructor(private readonly database: PrismaClient) {}

  public complete(command: CompletePhoneOtpCommand): Promise<PhoneOtpCompletionResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${CHALLENGE_LOCK_PREFIX}${command.challengeId}`}, 0))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${PHONE_IDENTITY_LOCK_PREFIX}${command.phoneNumber}`}, 0))`;

      const challenge = await transaction.phoneOtpChallenge.findFirst({
        where: {
          id: command.challengeId,
          phoneNumber: command.phoneNumber,
          browserBindingHash: command.browserBindingHash,
          providerVerifiedAt: { not: null },
          consumedAt: null,
        },
        select: { id: true },
      });
      const attempt = await transaction.phoneOtpAttempt.findFirst({
        where: {
          id: command.attemptId,
          challengeId: command.challengeId,
          outcome: PhoneOtpAttemptOutcome.PROVIDER_VERIFIED,
        },
        select: { id: true },
      });

      if (!challenge || !attempt) {
        return { status: PhoneOtpCompletionStatus.InvalidChallenge };
      }

      const identity = await transaction.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.PHONE,
            providerSubject: command.phoneNumber,
          },
        },
        select: { id: true, user: { select: authenticatedUserSelect } },
      });

      let user: AuthUser;
      if (identity) {
        await transaction.authIdentity.update({
          where: { id: identity.id },
          data: {
            phoneNumber: command.phoneNumber,
            lastAuthenticatedAt: command.authenticatedAt,
          },
        });
        user = identity.user.primaryPhone
          ? identity.user
          : await transaction.user.update({
              where: { id: identity.user.id },
              data: { primaryPhone: command.phoneNumber },
              select: authenticatedUserSelect,
            });
      } else {
        const phoneOwner = await transaction.user.findUnique({
          where: { primaryPhone: command.phoneNumber },
          select: { id: true },
        });

        if (phoneOwner) {
          await transaction.phoneOtpChallenge.update({
            where: { id: command.challengeId },
            data: {
              providerVerifiedAt: command.authenticatedAt,
              consumedAt: command.authenticatedAt,
            },
          });
          return { status: PhoneOtpCompletionStatus.LinkRequired };
        }

        user = await transaction.user.create({
          data: {
            primaryPhone: command.phoneNumber,
            authIdentities: {
              create: {
                provider: AuthProvider.PHONE,
                providerSubject: command.phoneNumber,
                phoneNumber: command.phoneNumber,
                lastAuthenticatedAt: command.authenticatedAt,
              },
            },
          },
          select: authenticatedUserSelect,
        });
      }

      const session = await transaction.session.create({
        data: {
          userId: user.id,
          tokenHash: command.tokenHash,
          expiresAt: command.sessionExpiresAt,
        },
        select: sessionSelect,
      });
      await transaction.phoneOtpChallenge.update({
        where: { id: command.challengeId },
        data: {
          providerVerifiedAt: command.authenticatedAt,
          consumedAt: command.authenticatedAt,
          sessionId: session.id,
        },
      });
      await transaction.phoneOtpAttempt.update({
        where: { id: command.attemptId },
        data: {
          outcome: PhoneOtpAttemptOutcome.AUTHENTICATED,
          completedAt: command.authenticatedAt,
        },
      });

      return { status: PhoneOtpCompletionStatus.Resolved, session };
    });
  }
}
