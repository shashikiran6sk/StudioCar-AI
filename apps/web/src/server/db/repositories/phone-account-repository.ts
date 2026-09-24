import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import { AuthProvider, PhoneOtpAttemptOutcome, Prisma as PrismaRuntime } from "@studiocar/database-runtime";

import type {
  CreatePhoneAccountCommand,
  CreatePhoneAccountResult,
  PhoneAccountRepositoryPort,
  VerifiedPhone,
  VerifiedPhoneQuery,
} from "../../auth/phone/phone-account.types";

const CHALLENGE_LOCK_PREFIX = "phone-otp-complete-challenge:";
const PHONE_IDENTITY_LOCK_PREFIX = "phone-identity:";

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

export class PrismaPhoneAccountRepository implements PhoneAccountRepositoryPort {
  public constructor(private readonly database: PrismaClient) {}

  public async findVerified(query: VerifiedPhoneQuery): Promise<VerifiedPhone | null> {
    const challenge = await this.database.phoneOtpChallenge.findFirst({
      where: {
        id: query.challengeId,
        browserBindingHash: query.browserBindingHash,
        providerVerifiedAt: { not: null },
        consumedAt: null,
        expiresAt: { gt: query.now },
      },
      select: { phoneNumber: true, expiresAt: true },
    });
    return challenge;
  }

  public async createAccount(
    command: CreatePhoneAccountCommand,
  ): Promise<CreatePhoneAccountResult> {
    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${CHALLENGE_LOCK_PREFIX}${command.challengeId}`}, 0))`;
        const challenge = await transaction.phoneOtpChallenge.findFirst({
          where: {
            id: command.challengeId,
            browserBindingHash: command.browserBindingHash,
            providerVerifiedAt: { not: null },
            consumedAt: null,
            expiresAt: { gt: command.now },
          },
          select: { phoneNumber: true },
        });
        if (!challenge) return { kind: "INVALID_VERIFICATION" };

        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${PHONE_IDENTITY_LOCK_PREFIX}${challenge.phoneNumber}`}, 0))`;
        const [identity, phoneOwner] = await Promise.all([
          transaction.authIdentity.findUnique({
            where: {
              provider_providerSubject: {
                provider: AuthProvider.PHONE,
                providerSubject: challenge.phoneNumber,
              },
            },
            select: { id: true },
          }),
          transaction.user.findUnique({
            where: { primaryPhone: challenge.phoneNumber },
            select: { id: true },
          }),
        ]);
        if (identity || phoneOwner) return { kind: "PHONE_TAKEN" };

        const user = await transaction.user.create({
          data: {
            displayName: command.displayName,
            primaryPhone: challenge.phoneNumber,
            authIdentities: {
              create: {
                provider: AuthProvider.PHONE,
                providerSubject: challenge.phoneNumber,
                phoneNumber: challenge.phoneNumber,
                lastAuthenticatedAt: command.now,
              },
            },
          },
          select: { id: true },
        });
        const session = await transaction.session.create({
          data: {
            userId: user.id,
            tokenHash: command.session.tokenHash,
            expiresAt: command.session.expiresAt,
          },
          select: sessionSelect,
        });
        await transaction.phoneOtpChallenge.update({
          where: { id: command.challengeId },
          data: { consumedAt: command.now, sessionId: session.id },
        });
        await transaction.phoneOtpAttempt.updateMany({
          where: {
            challengeId: command.challengeId,
            outcome: PhoneOtpAttemptOutcome.PROVIDER_VERIFIED,
          },
          data: {
            outcome: PhoneOtpAttemptOutcome.AUTHENTICATED,
            completedAt: command.now,
          },
        });
        return { kind: "CREATED", session };
      });
    } catch (error) {
      if (
        error instanceof PrismaRuntime.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { kind: "PHONE_TAKEN" };
      }
      throw error;
    }
  }
}
