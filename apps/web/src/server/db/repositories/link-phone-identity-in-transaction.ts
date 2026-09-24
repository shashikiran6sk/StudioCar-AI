import {
  IdentityLinkStatus,
  type IdentityLinkResult,
  type LinkPhoneIdentityCommand,
} from "@studiocar/contracts";
import type { Prisma } from "@studiocar/database-runtime";
import { AuthProvider } from "@studiocar/database-runtime";

const PHONE_IDENTITY_LOCK_PREFIX = "phone-identity:";

export async function linkPhoneIdentityInTransaction(
  transaction: Prisma.TransactionClient,
  command: LinkPhoneIdentityCommand,
): Promise<IdentityLinkResult> {
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
}
