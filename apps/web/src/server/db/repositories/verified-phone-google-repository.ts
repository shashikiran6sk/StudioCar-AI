import { IdentityLinkStatus } from "@studiocar/contracts";
import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import {
  AuthProvider,
  PhoneOtpAttemptOutcome,
  Prisma as PrismaRuntime,
} from "@studiocar/database-runtime";

import type {
  VerifiedPhoneGoogleResolution,
  VerifiedPhoneGoogleResolutionCommand,
  VerifiedPhoneGoogleStore,
} from "../../auth/google/google-auth.types";
import { linkPhoneIdentityInTransaction } from "./link-phone-identity-in-transaction";

const CHALLENGE_LOCK_PREFIX = "phone-otp-complete-challenge:";
const GOOGLE_SUBJECT_LOCK_PREFIX = "google-subject:";
const EMAIL_LOCK_PREFIX = "email:";

const sessionSelect = {
  id: true,
  userId: true,
  expiresAt: true,
  user: {
    select: {
      id: true,
      displayName: true,
      primaryEmail: true,
      primaryPhone: true,
    },
  },
} satisfies Prisma.SessionSelect;

class PhoneLinkConflictError extends Error {}

export class PrismaVerifiedPhoneGoogleRepository
  implements VerifiedPhoneGoogleStore
{
  public constructor(private readonly database: PrismaClient) {}

  public async resolve(
    command: VerifiedPhoneGoogleResolutionCommand,
  ): Promise<VerifiedPhoneGoogleResolution> {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${CHALLENGE_LOCK_PREFIX}${command.challengeId}`}, 0))`;
        const challenge = await transaction.phoneOtpChallenge.findFirst({
          where: {
            id: command.challengeId,
            browserBindingHash: command.browserBindingHash,
            providerVerifiedAt: { not: null },
            consumedAt: null,
            expiresAt: { gt: command.authenticatedAt },
          },
          select: { phoneNumber: true },
        });
        if (!challenge) return { kind: "INVALID_VERIFICATION" };

        const email = command.identity.email.toLowerCase();
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${GOOGLE_SUBJECT_LOCK_PREFIX}${command.identity.providerSubject}`}, 0))`;
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${EMAIL_LOCK_PREFIX}${email}`}, 0))`;
        const googleIdentity = await transaction.authIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: AuthProvider.GOOGLE,
              providerSubject: command.identity.providerSubject,
            },
          },
          select: { id: true, userId: true },
        });

        let userId: string;
        if (googleIdentity) {
          userId = googleIdentity.userId;
          await transaction.authIdentity.update({
            where: { id: googleIdentity.id },
            data: {
              email,
              emailVerifiedAt: command.authenticatedAt,
              lastAuthenticatedAt: command.authenticatedAt,
            },
          });
        } else {
          const emailOwner = await transaction.user.findUnique({
            where: { primaryEmail: email },
            select: { id: true },
          });
          if (emailOwner) return { kind: "GOOGLE_CONFLICT" };
          const user = await transaction.user.create({
            data: {
              displayName: command.identity.displayName,
              primaryEmail: email,
              authIdentities: {
                create: {
                  provider: AuthProvider.GOOGLE,
                  providerSubject: command.identity.providerSubject,
                  email,
                  emailVerifiedAt: command.authenticatedAt,
                  lastAuthenticatedAt: command.authenticatedAt,
                },
              },
            },
            select: { id: true },
          });
          userId = user.id;
        }

        const linked = await linkPhoneIdentityInTransaction(transaction, {
          userId,
          phoneNumber: challenge.phoneNumber,
          linkedAt: command.authenticatedAt,
        });
        if (
          linked.status === IdentityLinkStatus.IdentityTaken ||
          linked.status === IdentityLinkStatus.ContactTaken
        ) {
          throw new PhoneLinkConflictError();
        }

        const session = await transaction.session.create({
          data: {
            userId,
            tokenHash: command.session.tokenHash,
            expiresAt: command.session.expiresAt,
          },
          select: sessionSelect,
        });
        await transaction.phoneOtpChallenge.update({
          where: { id: command.challengeId },
          data: { consumedAt: command.authenticatedAt, sessionId: session.id },
        });
        await transaction.phoneOtpAttempt.updateMany({
          where: {
            challengeId: command.challengeId,
            outcome: PhoneOtpAttemptOutcome.PROVIDER_VERIFIED,
          },
          data: {
            outcome: PhoneOtpAttemptOutcome.AUTHENTICATED,
            completedAt: command.authenticatedAt,
          },
        });
        return { kind: "RESOLVED", session };
      });
    } catch (error) {
      if (error instanceof PhoneLinkConflictError) {
        return { kind: "PHONE_TAKEN" };
      }
      if (
        error instanceof PrismaRuntime.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { kind: "GOOGLE_CONFLICT" };
      }
      throw error;
    }
  }
}
