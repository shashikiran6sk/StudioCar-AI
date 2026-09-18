import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { GoogleIdentityResolutionStatus } from "../../../../packages/contracts/src/auth";
import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaGoogleIdentityRepository } from "../../../../packages/database/src/repositories/google-identity-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const emails = [
  "google-identity@integration.studiocar.test",
  "identity-conflict@integration.studiocar.test",
];

databaseDescribe("PrismaGoogleIdentityRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaGoogleIdentityRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaGoogleIdentityRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: { in: emails } } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("resolves repeat authentication by Google subject without duplicate users", async () => {
    const profile = {
      providerSubject: "integration-google-subject",
      email: emails[0] ?? "",
      displayName: "Studio Dealer",
    };
    const firstAuthentication = new Date("2026-09-18T12:00:00.000Z");
    const secondAuthentication = new Date("2026-09-18T13:00:00.000Z");

    const [first, concurrent] = await Promise.all([
      repository.resolve(profile, firstAuthentication),
      repository.resolve(profile, firstAuthentication),
    ]);
    const second = await repository.resolve(profile, secondAuthentication);

    expect(first).toMatchObject({ status: GoogleIdentityResolutionStatus.Resolved });
    expect(concurrent).toMatchObject({
      status: GoogleIdentityResolutionStatus.Resolved,
    });
    expect(second).toMatchObject({ status: GoogleIdentityResolutionStatus.Resolved });
    if (
      first.status !== GoogleIdentityResolutionStatus.Resolved ||
      concurrent.status !== GoogleIdentityResolutionStatus.Resolved ||
      second.status !== GoogleIdentityResolutionStatus.Resolved
    ) {
      throw new Error("Expected resolved Google identities.");
    }
    expect(concurrent.user.id).toBe(first.user.id);
    expect(second.user.id).toBe(first.user.id);
    await expect(
      database.authIdentity.count({
        where: {
          provider: "GOOGLE",
          providerSubject: profile.providerSubject,
        },
      }),
    ).resolves.toBe(1);
    await expect(
      database.authIdentity.findUnique({
        where: {
          provider_providerSubject: {
            provider: "GOOGLE",
            providerSubject: profile.providerSubject,
          },
        },
        select: { lastAuthenticatedAt: true },
      }),
    ).resolves.toEqual({ lastAuthenticatedAt: secondAuthentication });
  });

  it("requires explicit linking instead of matching users by email", async () => {
    const email = emails[1] ?? "";
    const existingUser = await database.user.create({
      data: { primaryEmail: email, primaryPhone: "+919876543210" },
    });

    await expect(
      repository.resolve(
        {
          providerSubject: "different-google-subject",
          email,
          displayName: "Another Dealer",
        },
        new Date("2026-09-18T12:00:00.000Z"),
      ),
    ).resolves.toEqual({ status: GoogleIdentityResolutionStatus.LinkRequired });
    await expect(
      database.authIdentity.count({ where: { userId: existingUser.id } }),
    ).resolves.toBe(0);
  });
});
