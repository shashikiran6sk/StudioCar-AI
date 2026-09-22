import type { Prisma, PrismaClient } from "@studiocar/database-runtime";
import { AuthProvider } from "@studiocar/database-runtime";

const googleChallengeSelect = {
  protectedPayload: true,
  returnTo: true,
} satisfies Prisma.OAuthChallengeSelect;

export interface CreateGoogleOAuthChallengeRecord {
  stateHash: string;
  protectedPayload: string;
  returnTo: string;
  expiresAt: Date;
}

export interface ConsumedGoogleOAuthChallenge {
  protectedPayload: string;
  returnTo: string;
}

export class PrismaGoogleOAuthChallengeRepository {
  public constructor(private readonly database: PrismaClient) {}

  public create(command: CreateGoogleOAuthChallengeRecord) {
    return this.database.oAuthChallenge.create({
      data: {
        ...command,
        provider: AuthProvider.GOOGLE,
      },
      select: googleChallengeSelect,
    });
  }

  public consume(
    stateHash: string,
    consumedAt: Date,
  ): Promise<ConsumedGoogleOAuthChallenge | null> {
    return this.database.$transaction(async (transaction) => {
      const claimed = await transaction.oAuthChallenge.updateMany({
        where: {
          provider: AuthProvider.GOOGLE,
          stateHash,
          consumedAt: null,
          expiresAt: { gt: consumedAt },
        },
        data: { consumedAt },
      });

      if (claimed.count === 0) return null;

      return transaction.oAuthChallenge.findUnique({
        where: { stateHash },
        select: googleChallengeSelect,
      });
    });
  }
}
