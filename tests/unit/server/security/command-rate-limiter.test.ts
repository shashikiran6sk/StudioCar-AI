import { describe, expect, it, vi } from "vitest";

import { CommandRateLimiter } from "../../../../apps/web/src/server/security/command-rate-limiter";
import type { CommandRateLimitRepositoryPort } from "../../../../apps/web/src/server/security/command-rate-limiter.types";
import { CommandRateLimitScope } from "../../../../packages/database/generated/prisma/client";

const NOW = new Date("2026-09-20T12:00:00.000Z");

describe("CommandRateLimiter", () => {
  it("passes the tenant, command scope, and sliding window to persistence", async () => {
    const repository: CommandRateLimitRepositoryPort = {
      consume: vi.fn(
        async (): Promise<{ allowed: true }> => ({ allowed: true }),
      ),
    };
    const limiter = new CommandRateLimiter(
      repository,
      {
        scope: CommandRateLimitScope.UPLOAD_PRESIGN,
        maximumRequests: 120,
        windowMilliseconds: 60_000,
      },
      () => NOW,
    );

    await expect(limiter.consume("user-1")).resolves.toEqual({ allowed: true });
    expect(repository.consume).toHaveBeenCalledWith({
      userId: "user-1",
      scope: CommandRateLimitScope.UPLOAD_PRESIGN,
      now: NOW,
      windowStart: new Date("2026-09-20T11:59:00.000Z"),
      maximumRequests: 120,
    });
  });

  it("returns a whole-second retry delay bounded to at least one second", async () => {
    const repository: CommandRateLimitRepositoryPort = {
      consume: vi
        .fn()
        .mockResolvedValueOnce({
          allowed: false,
          retryAt: new Date("2026-09-20T12:00:02.250Z"),
        })
        .mockResolvedValueOnce({
          allowed: false,
          retryAt: new Date("2026-09-20T11:59:59.000Z"),
        }),
    };
    const limiter = new CommandRateLimiter(
      repository,
      {
        scope: CommandRateLimitScope.PROCESSING_BATCH,
        maximumRequests: 20,
        windowMilliseconds: 60_000,
      },
      () => NOW,
    );

    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 3,
    });
    await expect(limiter.consume("user-1")).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });
});
