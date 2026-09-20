import type {
  DeleteExpiredRecordsCommand,
  LifecycleCleanupResult,
} from "@studiocar/database";

export interface LifecycleCleanupRepositoryPort {
  deleteExpiredSessions(command: DeleteExpiredRecordsCommand): Promise<number>;
  deleteExpiredOAuthChallenges(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number>;
  deleteExpiredPhoneOtpChallenges(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number>;
  deleteExpiredCommandRateLimitEvents(
    command: DeleteExpiredRecordsCommand,
  ): Promise<number>;
}

export interface LifecycleCleanupOptions {
  batchSize: number;
  sessionRetentionMilliseconds: number;
  authChallengeRetentionMilliseconds: number;
  commandRateLimitRetentionMilliseconds: number;
}

export interface LifecycleCleanupResponse extends LifecycleCleanupResult {
  total: number;
}

export interface LifecycleCleanupApplication {
  run(): Promise<LifecycleCleanupResponse>;
}
