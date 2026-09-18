import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpVerificationClaimStatus,
} from "../../../../packages/contracts/src/auth";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaPhoneOtpChallengeRepository } from "../../../../packages/database/src/repositories/phone-otp-challenge-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const phoneHash = "p".repeat(64);
const secondPhoneHash = "q".repeat(64);
const browserBindingHash = "b".repeat(64);
const requestIpHash = "i".repeat(64);

databaseDescribe("PrismaPhoneOtpChallengeRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaPhoneOtpChallengeRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaPhoneOtpChallengeRepository(database);
  });

  afterEach(async () => {
    await database.phoneOtpChallenge.deleteMany({
      where: { phoneHash: { in: [phoneHash, secondPhoneHash] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("atomically enforces concurrent send limits per phone", async () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const command = {
      phoneNumber: "+919876543210",
      phoneHash,
      browserBindingHash,
      requestIpHash,
      now,
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      windowStart: new Date("2026-09-18T11:50:00.000Z"),
      maxPerPhone: 3,
      maxPerIp: 10,
    };

    const results = await Promise.all([
      repository.createRateLimited(command),
      repository.createRateLimited(command),
      repository.createRateLimited(command),
      repository.createRateLimited(command),
    ]);

    expect(
      results.filter(
        (result) => result.status === PhoneOtpChallengeCreationStatus.Created,
      ),
    ).toHaveLength(3);
    expect(
      results.filter(
        (result) => result.status === PhoneOtpChallengeCreationStatus.RateLimited,
      ),
    ).toHaveLength(1);
  });

  it("requires the browser binding and caps verification attempts", async () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const created = await repository.createRateLimited({
      phoneNumber: "+919123456789",
      phoneHash: secondPhoneHash,
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
    await repository.markSent(created.challenge.id, "provider-request", now);

    await expect(
      repository.claimVerification({
        challengeId: created.challenge.id,
        phoneNumber: "+919123456789",
        browserBindingHash: "x".repeat(64),
        requestIpHash,
        now,
        windowStart: new Date("2026-09-18T11:50:00.000Z"),
        maxAttempts: 1,
        maxPerIp: 10,
      }),
    ).resolves.toEqual({
      status: PhoneOtpVerificationClaimStatus.InvalidChallenge,
    });

    const first = await repository.claimVerification({
      challengeId: created.challenge.id,
      phoneNumber: "+919123456789",
      browserBindingHash,
      requestIpHash,
      now,
      windowStart: new Date("2026-09-18T11:50:00.000Z"),
      maxAttempts: 1,
      maxPerIp: 10,
    });
    expect(first).toMatchObject({ status: PhoneOtpVerificationClaimStatus.Claimed });
    await expect(
      repository.claimVerification({
        challengeId: created.challenge.id,
        phoneNumber: "+919123456789",
        browserBindingHash,
        requestIpHash,
        now,
        windowStart: new Date("2026-09-18T11:50:00.000Z"),
        maxAttempts: 1,
        maxPerIp: 10,
      }),
    ).resolves.toEqual({
      status: PhoneOtpVerificationClaimStatus.TooManyAttempts,
    });
  });
});
