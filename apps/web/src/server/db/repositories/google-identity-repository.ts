import {
  GoogleIdentityResolutionStatus,
  type GoogleIdentity,
  type GoogleIdentityResolution,
} from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import { AuthProvider } from "@studiocar/database-runtime";

const resolvedUserSelect = {
  id: true,
  displayName: true,
  primaryEmail: true,
  primaryPhone: true,
} satisfies Prisma.UserSelect;

const GOOGLE_SUBJECT_LOCK_PREFIX = "google-subject:";
const EMAIL_LOCK_PREFIX = "email:";

export class PrismaGoogleIdentityRepository {
  public constructor(private readonly database: PrismaClient) {}

  public resolve(
    profile: GoogleIdentity,
    authenticatedAt: Date,
  ): Promise<GoogleIdentityResolution> {
    const normalizedEmail = profile.email.toLowerCase();

    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${GOOGLE_SUBJECT_LOCK_PREFIX}${profile.providerSubject}`}, 0))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${EMAIL_LOCK_PREFIX}${normalizedEmail}`}, 0))`;

      const identity = await transaction.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.GOOGLE,
            providerSubject: profile.providerSubject,
          },
        },
        select: {
          id: true,
          userId: true,
          user: { select: resolvedUserSelect },
        },
      });

      if (identity) {
        await transaction.authIdentity.update({
          where: { id: identity.id },
          data: {
            email: normalizedEmail,
            emailVerifiedAt: authenticatedAt,
            lastAuthenticatedAt: authenticatedAt,
          },
        });

        const user = identity.user.displayName
          ? identity.user
          : await transaction.user.update({
              where: { id: identity.userId },
              data: { displayName: profile.displayName },
              select: resolvedUserSelect,
            });

        return { status: GoogleIdentityResolutionStatus.Resolved, user };
      }

      const emailOwner = await transaction.user.findUnique({
        where: { primaryEmail: normalizedEmail },
        select: { id: true },
      });

      if (emailOwner) {
        return { status: GoogleIdentityResolutionStatus.LinkRequired };
      }

      const user = await transaction.user.create({
        data: {
          displayName: profile.displayName,
          primaryEmail: normalizedEmail,
          authIdentities: {
            create: {
              provider: AuthProvider.GOOGLE,
              providerSubject: profile.providerSubject,
              email: normalizedEmail,
              emailVerifiedAt: authenticatedAt,
              lastAuthenticatedAt: authenticatedAt,
            },
          },
        },
        select: resolvedUserSelect,
      });

      return { status: GoogleIdentityResolutionStatus.Resolved, user };
    });
  }
}
