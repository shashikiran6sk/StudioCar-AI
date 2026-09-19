import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { AuthProvider } from "../../../../packages/database/generated/prisma/client";
import { PrismaProfileRepository } from "../../../../packages/database/src/repositories/profile-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaProfileRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaProfileRepository;
  const email = "profile-owner@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaProfileRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: email } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns only the authenticated user's linked identities and active sessions", async () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const user = await database.user.create({
      data: {
        displayName: "Priya Sharma",
        primaryEmail: email,
        authIdentities: {
          create: {
            provider: AuthProvider.GOOGLE,
            providerSubject: "google-profile-owner",
            email,
            emailVerifiedAt: now,
            lastAuthenticatedAt: now,
          },
        },
        sessions: {
          create: [
            {
              tokenHash: "e".repeat(64),
              expiresAt: new Date("2026-10-19T12:00:00.000Z"),
            },
            {
              tokenHash: "f".repeat(64),
              expiresAt: new Date("2026-09-18T12:00:00.000Z"),
            },
          ],
        },
      },
    });

    const profile = await repository.findByUserId(user.id, now);

    expect(profile).toMatchObject({
      user: { id: user.id, displayName: "Priya Sharma" },
      activeSessionCount: 1,
      identities: [{ provider: "GOOGLE", email }],
    });
    expect(profile?.identities[0]).not.toHaveProperty("providerSubject");
  });

  it("updates a display name only for the requested user", async () => {
    const user = await database.user.create({
      data: { displayName: "Old Name", primaryEmail: email },
    });

    await expect(
      repository.updateDisplayName(user.id, "Priya Anand"),
    ).resolves.toMatchObject({ id: user.id, displayName: "Priya Anand" });
    await expect(
      repository.updateDisplayName(
        "00000000-0000-4000-8000-000000000000",
        "No User",
      ),
    ).resolves.toBeNull();
  });
});
