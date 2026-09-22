import {
  IdentityLinkStatus,
  type IdentityLinkResult,
  type LinkGoogleIdentityCommand,
  type LinkPhoneIdentityCommand,
} from "@studiocar/contracts";

import type { PrismaClient } from "@studiocar/database-runtime";
import { AuthProvider, Prisma } from "@studiocar/database-runtime";

const GOOGLE_SUBJECT_LOCK_PREFIX = "google-subject:";
const EMAIL_LOCK_PREFIX = "email:";
const PHONE_IDENTITY_LOCK_PREFIX = "phone-identity:";

/**
 * Attaches a second verified identity to an account that is already signed in.
 *
 * Linking never merges accounts and never transfers an identity. An identity
 * that already belongs to another user is refused, as is a contact detail
 * another account holds. Advisory locks plus the unique constraints on
 * `AuthIdentity` and on the user's primary contact decide every race.
 */
export class PrismaAuthIdentityLinkRepository {
  public constructor(private readonly database: PrismaClient) {}

  public linkGoogle(
    command: LinkGoogleIdentityCommand,
  ): Promise<IdentityLinkResult> {
    const email = command.email.toLowerCase();

    return this.run(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${GOOGLE_SUBJECT_LOCK_PREFIX}${command.providerSubject}`}, 0))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${EMAIL_LOCK_PREFIX}${email}`}, 0))`;

      const existing = await transaction.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.GOOGLE,
            providerSubject: command.providerSubject,
          },
        },
        select: { userId: true },
      });
      if (existing) {
        return {
          status:
            existing.userId === command.userId
              ? IdentityLinkStatus.AlreadyLinked
              : IdentityLinkStatus.IdentityTaken,
        };
      }

      const emailOwner = await transaction.user.findUnique({
        where: { primaryEmail: email },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== command.userId) {
        return { status: IdentityLinkStatus.ContactTaken };
      }

      await transaction.authIdentity.create({
        data: {
          userId: command.userId,
          provider: AuthProvider.GOOGLE,
          providerSubject: command.providerSubject,
          email,
          emailVerifiedAt: command.linkedAt,
          lastAuthenticatedAt: command.linkedAt,
        },
      });

      const user = await transaction.user.findUniqueOrThrow({
        where: { id: command.userId },
        select: { primaryEmail: true, displayName: true },
      });
      if (user.primaryEmail === null || user.displayName === null) {
        await transaction.user.update({
          where: { id: command.userId },
          data: {
            ...(user.primaryEmail === null ? { primaryEmail: email } : {}),
            ...(user.displayName === null && command.displayName !== null
              ? { displayName: command.displayName }
              : {}),
          },
        });
      }

      return { status: IdentityLinkStatus.Linked };
    });
  }

  public linkPhone(
    command: LinkPhoneIdentityCommand,
  ): Promise<IdentityLinkResult> {
    return this.run(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${PHONE_IDENTITY_LOCK_PREFIX}${command.phoneNumber}`}, 0))`;

      const existing = await transaction.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.PHONE,
            providerSubject: command.phoneNumber,
          },
        },
        select: { userId: true },
      });
      if (existing) {
        return {
          status:
            existing.userId === command.userId
              ? IdentityLinkStatus.AlreadyLinked
              : IdentityLinkStatus.IdentityTaken,
        };
      }

      const phoneOwner = await transaction.user.findUnique({
        where: { primaryPhone: command.phoneNumber },
        select: { id: true },
      });
      if (phoneOwner && phoneOwner.id !== command.userId) {
        return { status: IdentityLinkStatus.ContactTaken };
      }

      await transaction.authIdentity.create({
        data: {
          userId: command.userId,
          provider: AuthProvider.PHONE,
          providerSubject: command.phoneNumber,
          phoneNumber: command.phoneNumber,
          lastAuthenticatedAt: command.linkedAt,
        },
      });

      const user = await transaction.user.findUniqueOrThrow({
        where: { id: command.userId },
        select: { primaryPhone: true },
      });
      if (user.primaryPhone === null) {
        await transaction.user.update({
          where: { id: command.userId },
          data: { primaryPhone: command.phoneNumber },
        });
      }

      return { status: IdentityLinkStatus.Linked };
    });
  }

  /**
   * A unique-constraint violation means a concurrent link won the race, so the
   * identity now belongs to somebody; refusing is the same answer the losing
   * caller would have received a moment earlier.
   */
  private async run(
    operation: (transaction: Prisma.TransactionClient) => Promise<IdentityLinkResult>,
  ): Promise<IdentityLinkResult> {
    try {
      return await this.database.$transaction(operation);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { status: IdentityLinkStatus.IdentityTaken };
      }
      throw error;
    }
  }
}
