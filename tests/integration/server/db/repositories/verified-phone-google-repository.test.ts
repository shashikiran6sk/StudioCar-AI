import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaVerifiedPhoneGoogleRepository } from "../../../../../apps/web/src/server/db/repositories/verified-phone-google-repository";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const PHONE = "+918765432108";
const EMAIL = "phone-google-resolution@example.test";
const OTHER_EMAIL = "phone-google-conflict@example.test";
const BINDING_HASH = "g".repeat(64);
const NOW = new Date("2026-09-24T12:00:00.000Z");

databaseDescribe("PrismaVerifiedPhoneGoogleRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaVerifiedPhoneGoogleRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaVerifiedPhoneGoogleRepository(database);
  });

  afterEach(async () => {
    await database.phoneOtpChallenge.deleteMany({ where: { phoneNumber: PHONE } });
    await database.user.deleteMany({
      where: {
        OR: [
          { primaryPhone: PHONE },
          { primaryEmail: { in: [EMAIL, OTHER_EMAIL] } },
        ],
      },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createVerifiedChallenge() {
    return database.phoneOtpChallenge.create({
      data: {
        phoneNumber: PHONE,
        phoneHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
        browserBindingHash: BINDING_HASH,
        sendRequestIpHash: "i".repeat(64),
        expiresAt: new Date("2026-09-24T12:10:00.000Z"),
        sentAt: NOW,
        providerVerifiedAt: NOW,
      },
      select: { id: true },
    });
  }

  function command(challengeId: string) {
    return {
      challengeId,
      browserBindingHash: BINDING_HASH,
      identity: {
        providerSubject: "phone-google-subject",
        email: EMAIL,
        displayName: "Google Owner",
      },
      authenticatedAt: NOW,
      session: {
        token: "t".repeat(43),
        tokenHash: "g".repeat(64),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
      },
    };
  }

  it("attaches a new verified phone to the existing Google user", async () => {
    const user = await database.user.create({
      data: {
        primaryEmail: EMAIL,
        authIdentities: {
          create: {
            provider: "GOOGLE",
            providerSubject: "phone-google-subject",
            email: EMAIL,
            emailVerifiedAt: NOW,
          },
        },
      },
      select: { id: true },
    });
    const challenge = await createVerifiedChallenge();
    const result = await repository.resolve(command(challenge.id));
    expect(result.kind).toBe("RESOLVED");
    if (result.kind !== "RESOLVED") throw new Error("Expected resolution.");
    expect(result.session.userId).toBe(user.id);
    expect(result.session.user.primaryPhone).toBe(PHONE);
    await expect(database.user.count({ where: { primaryEmail: EMAIL } })).resolves.toBe(1);
    await expect(
      database.authIdentity.count({ where: { userId: user.id } }),
    ).resolves.toBe(2);
    await expect(repository.resolve(command(challenge.id))).resolves.toEqual({
      kind: "INVALID_VERIFICATION",
    });
  });

  it("creates one user with phone and Google identities", async () => {
    const challenge = await createVerifiedChallenge();
    const result = await repository.resolve(command(challenge.id));
    expect(result.kind).toBe("RESOLVED");
    if (result.kind !== "RESOLVED") throw new Error("Expected resolution.");
    await expect(database.user.count({ where: { primaryEmail: EMAIL } })).resolves.toBe(1);
    await expect(
      database.authIdentity.findMany({
        where: { userId: result.session.userId },
        orderBy: { provider: "asc" },
        select: { provider: true, providerSubject: true },
      }),
    ).resolves.toEqual([
      { provider: "GOOGLE", providerSubject: "phone-google-subject" },
      { provider: "PHONE", providerSubject: PHONE },
    ]);
    await expect(
      database.session.count({ where: { userId: result.session.userId } }),
    ).resolves.toBe(1);
  });

  it("refuses a phone attached during OAuth without creating another user", async () => {
    const challenge = await createVerifiedChallenge();
    await database.user.create({
      data: {
        primaryPhone: PHONE,
        authIdentities: {
          create: {
            provider: "PHONE",
            providerSubject: PHONE,
            phoneNumber: PHONE,
          },
        },
      },
    });
    await expect(repository.resolve(command(challenge.id))).resolves.toEqual({
      kind: "PHONE_TAKEN",
    });
    await expect(database.user.count({ where: { primaryEmail: EMAIL } })).resolves.toBe(0);
  });

  it("does not silently link a new Google subject by matching email", async () => {
    const challenge = await createVerifiedChallenge();
    await database.user.create({ data: { primaryEmail: EMAIL } });
    await expect(repository.resolve(command(challenge.id))).resolves.toEqual({
      kind: "GOOGLE_CONFLICT",
    });
    await expect(
      database.authIdentity.count({ where: { provider: "GOOGLE" } }),
    ).resolves.toBe(0);
  });

  it("refuses an expired or forged verified-phone binding", async () => {
    const challenge = await createVerifiedChallenge();
    await expect(repository.resolve({
      ...command(challenge.id),
      browserBindingHash: "f".repeat(64),
    })).resolves.toEqual({ kind: "INVALID_VERIFICATION" });
    await expect(repository.resolve({
      ...command(challenge.id),
      authenticatedAt: new Date("2026-09-24T12:10:00.000Z"),
    })).resolves.toEqual({ kind: "INVALID_VERIFICATION" });
  });
});
