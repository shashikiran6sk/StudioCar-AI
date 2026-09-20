import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaCommandRateLimitRepository } from "../../../../packages/database/src/repositories/command-rate-limit-repository";
import { CommandRateLimitScope } from "../../../../packages/database/generated/prisma/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const TEST_EMAIL = "command-rate-limit@example.test";

databaseDescribe("PrismaCommandRateLimitRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaCommandRateLimitRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaCommandRateLimitRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: TEST_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("serializes concurrent requests and isolates command scopes", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    const now = new Date("2026-09-20T12:00:00.000Z");
    const uploadCommand = {
      userId: user.id,
      scope: CommandRateLimitScope.UPLOAD_PRESIGN,
      now,
      windowStart: new Date("2026-09-20T11:59:00.000Z"),
      maximumRequests: 2,
    };

    const results = await Promise.all([
      repository.consume(uploadCommand),
      repository.consume(uploadCommand),
      repository.consume(uploadCommand),
    ]);

    expect(results.filter((result) => result.allowed)).toHaveLength(2);
    const limited = results.find((result) => !result.allowed);
    expect(limited).toEqual({
      allowed: false,
      retryAt: new Date("2026-09-20T12:01:00.000Z"),
    });
    await expect(
      repository.consume({
        ...uploadCommand,
        scope: CommandRateLimitScope.PROCESSING_BATCH,
        maximumRequests: 1,
      }),
    ).resolves.toEqual({ allowed: true });
  });

  it("permits a new request after the exact sliding window elapses", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    const firstAt = new Date("2026-09-20T12:00:00.000Z");
    const baseCommand = {
      userId: user.id,
      scope: CommandRateLimitScope.PROCESSING_BATCH,
      now: firstAt,
      windowStart: new Date("2026-09-20T11:59:00.000Z"),
      maximumRequests: 1,
    };

    await expect(repository.consume(baseCommand)).resolves.toEqual({
      allowed: true,
    });
    await expect(repository.consume(baseCommand)).resolves.toEqual({
      allowed: false,
      retryAt: new Date("2026-09-20T12:01:00.000Z"),
    });
    await expect(
      repository.consume({
        ...baseCommand,
        now: new Date("2026-09-20T12:01:00.000Z"),
        windowStart: firstAt,
      }),
    ).resolves.toEqual({ allowed: true });
  });
});
