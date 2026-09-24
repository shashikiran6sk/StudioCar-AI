import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaPhoneAccountRepository } from "../../../../../apps/web/src/server/db/repositories/phone-account-repository";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const PHONE = "+918765432109";
const BINDING_HASH = "b".repeat(64);
const NOW = new Date("2026-09-24T12:00:00.000Z");
const EXPIRES_AT = new Date("2026-09-24T12:10:00.000Z");

databaseDescribe("PrismaPhoneAccountRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaPhoneAccountRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaPhoneAccountRepository(database);
  });

  afterEach(async () => {
    await database.phoneOtpChallenge.deleteMany({ where: { phoneNumber: PHONE } });
    await database.user.deleteMany({ where: { primaryPhone: PHONE } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createVerifiedChallenge(expiresAt = EXPIRES_AT) {
    return database.phoneOtpChallenge.create({
      data: {
        phoneNumber: PHONE,
        phoneHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
        browserBindingHash: BINDING_HASH,
        sendRequestIpHash: "i".repeat(64),
        expiresAt,
        sentAt: NOW,
        providerVerifiedAt: NOW,
      },
      select: { id: true },
    });
  }

  it("creates one named phone account and session despite concurrent replay", async () => {
    const challenge = await createVerifiedChallenge();
    const command = {
      challengeId: challenge.id,
      browserBindingHash: BINDING_HASH,
      now: NOW,
      displayName: "Shashi Kiran",
      session: {
        token: "t".repeat(43),
        tokenHash: "t".repeat(64),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
      },
    };
    const [first, second] = await Promise.all([
      repository.createAccount(command),
      repository.createAccount({
        ...command,
        session: { ...command.session, tokenHash: "u".repeat(64) },
      }),
    ]);
    expect([first.kind, second.kind].sort()).toEqual([
      "CREATED",
      "INVALID_VERIFICATION",
    ]);
    await expect(repository.createAccount(command)).resolves.toEqual({
      kind: "INVALID_VERIFICATION",
    });
    await expect(database.user.count({ where: { primaryPhone: PHONE } })).resolves.toBe(1);
    await expect(
      database.authIdentity.count({
        where: { provider: "PHONE", providerSubject: PHONE },
      }),
    ).resolves.toBe(1);
    await expect(
      database.session.count({ where: { user: { primaryPhone: PHONE } } }),
    ).resolves.toBe(1);
  });

  it("refuses a phone attached after verification", async () => {
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
    await expect(repository.createAccount({
      challengeId: challenge.id,
      browserBindingHash: BINDING_HASH,
      now: NOW,
      displayName: "Second Account",
      session: {
        token: "t".repeat(43),
        tokenHash: "v".repeat(64),
        expiresAt: EXPIRES_AT,
      },
    })).resolves.toEqual({ kind: "PHONE_TAKEN" });
    await expect(database.user.count({ where: { primaryPhone: PHONE } })).resolves.toBe(1);
  });

  it("requires the browser-bound, unexpired verification", async () => {
    const challenge = await createVerifiedChallenge();
    await expect(repository.findVerified({
      challengeId: challenge.id,
      browserBindingHash: "f".repeat(64),
      now: NOW,
    })).resolves.toBeNull();
    await expect(repository.findVerified({
      challengeId: challenge.id,
      browserBindingHash: BINDING_HASH,
      now: EXPIRES_AT,
    })).resolves.toBeNull();
    await expect(repository.findVerified({
      challengeId: challenge.id,
      browserBindingHash: BINDING_HASH,
      now: NOW,
    })).resolves.toEqual({ phoneNumber: PHONE, expiresAt: EXPIRES_AT });
  });
});
