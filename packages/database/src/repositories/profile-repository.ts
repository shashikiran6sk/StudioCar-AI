import type { AccountProfile, AuthUser } from "@studiocar/contracts";

import type { Prisma, PrismaClient } from "../../generated/prisma/client";

const profileIdentitySelect = {
  provider: true,
  email: true,
  phoneNumber: true,
  createdAt: true,
  lastAuthenticatedAt: true,
} satisfies Prisma.AuthIdentitySelect;

const profileUserSelect = {
  id: true,
  displayName: true,
  primaryEmail: true,
  primaryPhone: true,
} satisfies Prisma.UserSelect;

export class PrismaProfileRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async findByUserId(
    userId: string,
    now: Date,
  ): Promise<AccountProfile | null> {
    const profile = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        ...profileUserSelect,
        authIdentities: {
          orderBy: { createdAt: "asc" },
          select: profileIdentitySelect,
        },
        _count: {
          select: {
            sessions: {
              where: { revokedAt: null, expiresAt: { gt: now } },
            },
          },
        },
      },
    });

    if (!profile) return null;

    return {
      user: {
        id: profile.id,
        displayName: profile.displayName,
        primaryEmail: profile.primaryEmail,
        primaryPhone: profile.primaryPhone,
      },
      identities: profile.authIdentities.map((identity) => ({
        provider: identity.provider,
        email: identity.email,
        phoneNumber: identity.phoneNumber,
        linkedAt: identity.createdAt.toISOString(),
        lastAuthenticatedAt: identity.lastAuthenticatedAt?.toISOString() ?? null,
      })),
      activeSessionCount: profile._count.sessions,
    };
  }

  public async updateDisplayName(
    userId: string,
    displayName: string,
  ): Promise<AuthUser | null> {
    const updated = await this.database.user.updateMany({
      where: { id: userId },
      data: { displayName },
    });
    if (updated.count === 0) return null;

    return this.database.user.findUnique({
      where: { id: userId },
      select: profileUserSelect,
    });
  }
}
