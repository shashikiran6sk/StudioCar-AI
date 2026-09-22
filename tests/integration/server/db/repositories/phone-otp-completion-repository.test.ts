import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpCompletionStatus,
  PhoneOtpVerificationClaimStatus,
} from "../../../../../packages/contracts/src/auth";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaPhoneOtpChallengeRepository } from "../../../../../apps/web/src/server/db/repositories/phone-otp-challenge-repository";
import { PrismaPhoneOtpCompletionRepository } from "../../../../../apps/web/src/server/db/repositories/phone-otp-completion-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const PRIMARY_PHONE_NUMBER = "+919876543210";
const CONFLICT_PHONE_NUMBER = "+919123456789";
const phoneNumbers = [PRIMARY_PHONE_NUMBER, CONFLICT_PHONE_NUMBER];
const browserBindingHash = "b".repeat(64);
const requestIpHash = "i".repeat(64);

databaseDescribe("PrismaPhoneOtpCompletionRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let challenges: PrismaPhoneOtpChallengeRepository;
  let completions: PrismaPhoneOtpCompletionRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    challenges = new PrismaPhoneOtpChallengeRepository(database);
    completions = new PrismaPhoneOtpCompletionRepository(database);
  });

  afterEach(async () => {
    await database.phoneOtpChallenge.deleteMany({
      where: { phoneNumber: { in: phoneNumbers } },
    });
    await database.user.deleteMany({
      where: { primaryPhone: { in: phoneNumbers } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function verifiedChallenge(phoneNumber: string, hashCharacter: string) {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const created = await challenges.createRateLimited({
      phoneNumber,
      phoneHash: hashCharacter.repeat(64),
      browserBindingHash,
      requestIpHash,
      now,
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      windowStart: new Date("2026-09-18T11:50:00.000Z"),
      maxPerPhone: 3,
      maxPerIp: 10,
    });
    if (created.status !== PhoneOtpChallengeCreationStatus.Created) {
      throw new Error("Expected an OTP challenge.");
    }
    await challenges.markSent(created.challenge.id, "provider-request", now);
    const claim = await challenges.claimVerification({
      challengeId: created.challenge.id,
      phoneNumber,
      browserBindingHash,
      requestIpHash,
      now,
      windowStart: new Date("2026-09-18T11:50:00.000Z"),
      maxAttempts: 5,
      maxPerIp: 30,
    });
    if (claim.status !== PhoneOtpVerificationClaimStatus.Claimed) {
      throw new Error("Expected a verification claim.");
    }
    await challenges.recordProviderVerified(
      created.challenge.id,
      claim.attemptId,
      now,
    );
    return { challengeId: created.challenge.id, attemptId: claim.attemptId, now };
  }

  it("atomically creates one phone identity and one session", async () => {
    const verified = await verifiedChallenge(PRIMARY_PHONE_NUMBER, "p");
    const command = {
      challengeId: verified.challengeId,
      attemptId: verified.attemptId,
      phoneNumber: PRIMARY_PHONE_NUMBER,
      browserBindingHash,
      tokenHash: "t".repeat(64),
      sessionExpiresAt: new Date("2026-10-18T12:00:00.000Z"),
      authenticatedAt: verified.now,
    };
    const [first, concurrent] = await Promise.all([
      completions.complete(command),
      completions.complete({ ...command, tokenHash: "u".repeat(64) }),
    ]);
    const results = [first, concurrent];

    expect(
      results.filter((result) => result.status === PhoneOtpCompletionStatus.Resolved),
    ).toHaveLength(1);
    expect(
      results.filter(
        (result) => result.status === PhoneOtpCompletionStatus.InvalidChallenge,
      ),
    ).toHaveLength(1);
    await expect(
      database.authIdentity.count({
        where: { provider: "PHONE", providerSubject: PRIMARY_PHONE_NUMBER },
      }),
    ).resolves.toBe(1);
    await expect(
      database.session.count({
        where: { user: { primaryPhone: PRIMARY_PHONE_NUMBER } },
      }),
    ).resolves.toBe(1);
  });

  it("requires explicit linking when the phone already belongs to a user", async () => {
    const phoneNumber = CONFLICT_PHONE_NUMBER;
    await database.user.create({ data: { primaryPhone: phoneNumber } });
    const verified = await verifiedChallenge(phoneNumber, "q");

    await expect(
      completions.complete({
        challengeId: verified.challengeId,
        attemptId: verified.attemptId,
        phoneNumber,
        browserBindingHash,
        tokenHash: "v".repeat(64),
        sessionExpiresAt: new Date("2026-10-18T12:00:00.000Z"),
        authenticatedAt: verified.now,
      }),
    ).resolves.toEqual({ status: PhoneOtpCompletionStatus.LinkRequired });
    await expect(
      database.authIdentity.count({ where: { providerSubject: phoneNumber } }),
    ).resolves.toBe(0);
    await expect(
      database.session.count({ where: { user: { primaryPhone: phoneNumber } } }),
    ).resolves.toBe(0);
  });
});
