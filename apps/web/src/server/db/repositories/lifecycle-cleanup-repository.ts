import type { PrismaClient } from "@studiocar/database-runtime";

export interface DeleteExpiredRecordsCommand {
  cutoff: Date;
  batchSize: number;
}

export interface LifecycleCleanupResult {
  sessions: number;
  oauthChallenges: number;
  phoneOtpChallenges: number;
  commandRateLimitEvents: number;
}

export class PrismaLifecycleCleanupRepository {
  public constructor(private readonly database: PrismaClient) {}

  public deleteExpiredSessions(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number> {
    return this.database.$executeRaw`
      WITH candidates AS (
        SELECT "id"
        FROM "Session"
        WHERE "expiresAt" < ${command.cutoff}
        ORDER BY "expiresAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      )
      DELETE FROM "Session" target
      USING candidates
      WHERE target."id" = candidates."id"
    `;
  }

  public deleteExpiredOAuthChallenges(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number> {
    return this.database.$executeRaw`
      WITH candidates AS (
        SELECT "id"
        FROM "OAuthChallenge"
        WHERE "expiresAt" < ${command.cutoff}
        ORDER BY "expiresAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      )
      DELETE FROM "OAuthChallenge" target
      USING candidates
      WHERE target."id" = candidates."id"
    `;
  }

  public deleteExpiredPhoneOtpChallenges(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number> {
    return this.database.$executeRaw`
      WITH candidates AS (
        SELECT "id"
        FROM "PhoneOtpChallenge"
        WHERE "expiresAt" < ${command.cutoff}
        ORDER BY "expiresAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      )
      DELETE FROM "PhoneOtpChallenge" target
      USING candidates
      WHERE target."id" = candidates."id"
    `;
  }

  public deleteExpiredCommandRateLimitEvents(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number> {
    return this.database.$executeRaw`
      WITH candidates AS (
        SELECT "id"
        FROM "CommandRateLimitEvent"
        WHERE "occurredAt" < ${command.cutoff}
        ORDER BY "occurredAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      )
      DELETE FROM "CommandRateLimitEvent" target
      USING candidates
      WHERE target."id" = candidates."id"
    `;
  }
}
