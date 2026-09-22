import type { Prisma, PrismaClient } from "@studiocar/database-runtime";

const sessionSelect = {
  id: true,
  userId: true,
  expiresAt: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      displayName: true,
      primaryEmail: true,
      primaryPhone: true,
    },
  },
} satisfies Prisma.SessionSelect;

export interface CreateSessionRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RotateSessionRecord extends CreateSessionRecord {
  currentSessionId: string;
  now: Date;
}

export class PrismaSessionRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async create(command: CreateSessionRecord) {
    return this.database.session.create({
      data: command,
      select: sessionSelect,
    });
  }

  public async findActiveByTokenHash(tokenHash: string, now: Date) {
    return this.database.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: sessionSelect,
    });
  }

  public async rotate(command: RotateSessionRecord) {
    return this.database.$transaction(async (transaction) => {
      const revoked = await transaction.session.updateMany({
        where: {
          id: command.currentSessionId,
          userId: command.userId,
          revokedAt: null,
          expiresAt: { gt: command.now },
        },
        data: { revokedAt: command.now },
      });

      if (revoked.count === 0) return null;

      return transaction.session.create({
        data: {
          userId: command.userId,
          tokenHash: command.tokenHash,
          expiresAt: command.expiresAt,
          rotatedFromSessionId: command.currentSessionId,
        },
        select: sessionSelect,
      });
    });
  }

  public async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<boolean> {
    const result = await this.database.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });

    return result.count > 0;
  }

  public async revokeAllForUser(userId: string, revokedAt: Date): Promise<number> {
    const result = await this.database.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });

    return result.count;
  }
}
