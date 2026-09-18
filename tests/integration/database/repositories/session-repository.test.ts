import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaSessionRepository } from "../../../../packages/database/src/repositories/session-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaSessionRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaSessionRepository;
  const userEmail = "session-owner@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaSessionRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: userEmail } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("finds, rotates, and revokes only active opaque sessions", async () => {
    const user = await database.user.create({ data: { primaryEmail: userEmail } });
    const now = new Date("2026-09-18T12:00:00.000Z");
    const expiresAt = new Date("2026-10-18T12:00:00.000Z");
    const currentHash = "a".repeat(64);
    const nextHash = "b".repeat(64);
    const current = await repository.create({ userId: user.id, tokenHash: currentHash, expiresAt });

    const active = await repository.findActiveByTokenHash(currentHash, now);
    expect(active).toMatchObject({ id: current.id, userId: user.id });
    expect(active).not.toHaveProperty("tokenHash");

    const rotated = await repository.rotate({
      currentSessionId: current.id,
      userId: user.id,
      tokenHash: nextHash,
      expiresAt,
      now,
    });
    expect(rotated).toMatchObject({ userId: user.id });
    await expect(repository.findActiveByTokenHash(currentHash, now)).resolves.toBeNull();
    await expect(repository.findActiveByTokenHash(nextHash, now)).resolves.toMatchObject({
      id: rotated?.id,
    });

    await expect(
      repository.rotate({
        currentSessionId: current.id,
        userId: user.id,
        tokenHash: "c".repeat(64),
        expiresAt,
        now,
      }),
    ).resolves.toBeNull();
    await expect(repository.revokeAllForUser(user.id, now)).resolves.toBe(1);
    await expect(repository.findActiveByTokenHash(nextHash, now)).resolves.toBeNull();
  });

  it("does not return expired sessions", async () => {
    const user = await database.user.create({ data: { primaryEmail: userEmail } });
    const tokenHash = "d".repeat(64);
    await repository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date("2026-09-17T12:00:00.000Z"),
    });

    await expect(
      repository.findActiveByTokenHash(tokenHash, new Date("2026-09-18T12:00:00.000Z")),
    ).resolves.toBeNull();
  });
});
