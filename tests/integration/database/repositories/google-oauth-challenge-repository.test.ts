import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaGoogleOAuthChallengeRepository } from "../../../../packages/database/src/repositories/google-oauth-challenge-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const stateHashes = ["a".repeat(64), "b".repeat(64)];

databaseDescribe("PrismaGoogleOAuthChallengeRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaGoogleOAuthChallengeRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaGoogleOAuthChallengeRepository(database);
  });

  afterEach(async () => {
    await database.oAuthChallenge.deleteMany({
      where: { stateHash: { in: stateHashes } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("atomically consumes an active challenge only once", async () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    await repository.create({
      stateHash: stateHashes[0] ?? "",
      protectedPayload: "protected-payload",
      returnTo: "/inventory",
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    });

    const results = await Promise.all([
      repository.consume(stateHashes[0] ?? "", now),
      repository.consume(stateHashes[0] ?? "", now),
    ]);

    expect(results.filter((result) => result !== null)).toEqual([
      { protectedPayload: "protected-payload", returnTo: "/inventory" },
    ]);
  });

  it("does not consume an expired challenge", async () => {
    await repository.create({
      stateHash: stateHashes[1] ?? "",
      protectedPayload: "protected-payload",
      returnTo: "/dashboard",
      expiresAt: new Date("2026-09-18T11:59:59.000Z"),
    });

    await expect(
      repository.consume(
        stateHashes[1] ?? "",
        new Date("2026-09-18T12:00:00.000Z"),
      ),
    ).resolves.toBeNull();
  });
});
