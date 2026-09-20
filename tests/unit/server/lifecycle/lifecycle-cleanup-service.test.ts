import { describe, expect, it, vi } from "vitest";

import { LifecycleCleanupService } from "../../../../apps/web/src/server/lifecycle/lifecycle-cleanup-service";
import type { LifecycleCleanupRepositoryPort } from "../../../../apps/web/src/server/lifecycle/lifecycle-cleanup.types";

const NOW = new Date("2026-09-20T12:00:00.000Z");

describe("LifecycleCleanupService", () => {
  it("applies independent retention cutoffs and returns aggregate counts", async () => {
    const repository: LifecycleCleanupRepositoryPort = {
      deleteExpiredSessions: vi.fn(async () => 2),
      deleteExpiredOAuthChallenges: vi.fn(async () => 3),
      deleteExpiredPhoneOtpChallenges: vi.fn(async () => 4),
      deleteExpiredCommandRateLimitEvents: vi.fn(async () => 5),
    };
    const service = new LifecycleCleanupService(
      repository,
      {
        batchSize: 100,
        sessionRetentionMilliseconds: 30 * 24 * 60 * 60 * 1_000,
        authChallengeRetentionMilliseconds: 7 * 24 * 60 * 60 * 1_000,
        commandRateLimitRetentionMilliseconds: 24 * 60 * 60 * 1_000,
      },
      () => NOW,
    );

    await expect(service.run()).resolves.toEqual({
      sessions: 2,
      oauthChallenges: 3,
      phoneOtpChallenges: 4,
      commandRateLimitEvents: 5,
      total: 14,
    });
    expect(repository.deleteExpiredSessions).toHaveBeenCalledWith({
      cutoff: new Date("2026-08-21T12:00:00.000Z"),
      batchSize: 100,
    });
    expect(repository.deleteExpiredOAuthChallenges).toHaveBeenCalledWith({
      cutoff: new Date("2026-09-13T12:00:00.000Z"),
      batchSize: 100,
    });
    expect(repository.deleteExpiredPhoneOtpChallenges).toHaveBeenCalledWith({
      cutoff: new Date("2026-09-13T12:00:00.000Z"),
      batchSize: 100,
    });
    expect(repository.deleteExpiredCommandRateLimitEvents).toHaveBeenCalledWith({
      cutoff: new Date("2026-09-19T12:00:00.000Z"),
      batchSize: 100,
    });
  });
});
