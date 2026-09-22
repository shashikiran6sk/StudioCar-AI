import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaLifecycleCleanupRepository } from "../../../../../apps/web/src/server/db/repositories/lifecycle-cleanup-repository";
import { CommandRateLimitScope } from "../../../../../packages/database-runtime/generated/prisma/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const TEST_EMAIL = "lifecycle-cleanup@example.test";
const OAUTH_STATE_PREFIX = "lifecycle-cleanup-state-";

databaseDescribe("PrismaLifecycleCleanupRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaLifecycleCleanupRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaLifecycleCleanupRepository(database);
  });

  afterEach(async () => {
    await database.phoneOtpChallenge.deleteMany({
      where: { phoneHash: { in: ["c".repeat(64), "f".repeat(64)] } },
    });
    await database.oAuthChallenge.deleteMany({
      where: { stateHash: { startsWith: OAUTH_STATE_PREFIX } },
    });
    await database.user.deleteMany({ where: { primaryEmail: TEST_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("deletes only records older than each cutoff", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    await database.session.createMany({
      data: [
        {
          userId: user.id,
          tokenHash: "a".repeat(64),
          expiresAt: new Date("2026-08-01T00:00:00.000Z"),
        },
        {
          userId: user.id,
          tokenHash: "b".repeat(64),
          expiresAt: new Date("2026-09-19T00:00:00.000Z"),
        },
      ],
    });
    await database.oAuthChallenge.createMany({
      data: [
        {
          provider: "GOOGLE",
          stateHash: `${OAUTH_STATE_PREFIX}${"a".repeat(40)}`,
          protectedPayload: "protected",
          returnTo: "/dashboard",
          expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        },
        {
          provider: "GOOGLE",
          stateHash: `${OAUTH_STATE_PREFIX}${"b".repeat(40)}`,
          protectedPayload: "protected",
          returnTo: "/dashboard",
          expiresAt: new Date("2026-09-19T00:00:00.000Z"),
        },
      ],
    });
    await database.phoneOtpChallenge.createMany({
      data: [
        {
          phoneNumber: "+919876543210",
          phoneHash: "c".repeat(64),
          browserBindingHash: "d".repeat(64),
          sendRequestIpHash: "e".repeat(64),
          expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        },
        {
          phoneNumber: "+919876543211",
          phoneHash: "f".repeat(64),
          browserBindingHash: "g".repeat(64),
          sendRequestIpHash: "h".repeat(64),
          expiresAt: new Date("2026-09-19T00:00:00.000Z"),
        },
      ],
    });
    await database.commandRateLimitEvent.createMany({
      data: [
        {
          userId: user.id,
          scope: CommandRateLimitScope.UPLOAD_PRESIGN,
          occurredAt: new Date("2026-09-18T00:00:00.000Z"),
        },
        {
          userId: user.id,
          scope: CommandRateLimitScope.UPLOAD_PRESIGN,
          occurredAt: new Date("2026-09-20T00:00:00.000Z"),
        },
      ],
    });

    await expect(
      repository.deleteExpiredSessions({
        cutoff: new Date("2026-09-01T00:00:00.000Z"),
        batchSize: 10,
      }),
    ).resolves.toBe(1);
    await expect(
      repository.deleteExpiredOAuthChallenges({
        cutoff: new Date("2026-09-10T00:00:00.000Z"),
        batchSize: 10,
      }),
    ).resolves.toBe(1);
    await expect(
      repository.deleteExpiredPhoneOtpChallenges({
        cutoff: new Date("2026-09-10T00:00:00.000Z"),
        batchSize: 10,
      }),
    ).resolves.toBe(1);
    await expect(
      repository.deleteExpiredCommandRateLimitEvents({
        cutoff: new Date("2026-09-19T00:00:00.000Z"),
        batchSize: 10,
      }),
    ).resolves.toBe(1);

    await expect(database.session.count({ where: { userId: user.id } })).resolves.toBe(1);
    await expect(
      database.oAuthChallenge.count({
        where: { stateHash: { startsWith: OAUTH_STATE_PREFIX } },
      }),
    ).resolves.toBe(1);
    await expect(database.phoneOtpChallenge.count()).resolves.toBe(1);
    await expect(
      database.commandRateLimitEvent.count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });

  it("never deletes more than the configured batch", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    await database.session.createMany({
      data: ["i", "j", "k"].map((character) => ({
        userId: user.id,
        tokenHash: character.repeat(64),
        expiresAt: new Date("2026-08-01T00:00:00.000Z"),
      })),
    });

    await expect(
      repository.deleteExpiredSessions({
        cutoff: new Date("2026-09-01T00:00:00.000Z"),
        batchSize: 2,
      }),
    ).resolves.toBe(2);
    await expect(database.session.count({ where: { userId: user.id } })).resolves.toBe(1);
  });
});
