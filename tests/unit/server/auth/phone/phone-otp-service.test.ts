import {
  PhoneOtpChallengeCreationStatus,
  PhoneOtpCompletionStatus,
  PhoneOtpVerificationClaimStatus,
  type ClaimPhoneOtpVerificationResult,
  type CreatePhoneOtpChallengeResult,
  type PhoneOtpCompletionResult,
} from "../../../../../packages/contracts/src/auth";
import { describe, expect, it, vi } from "vitest";

import { SensitiveIdentifierHasher } from "../../../../../apps/web/src/server/auth/hash-sensitive-identifier";
import { hashSessionToken } from "../../../../../apps/web/src/server/auth/session-service";
import {
  PhoneOtpProviderVerificationStatus,
  type PhoneOtpChallengeStore,
  type PhoneOtpCompletionStore,
  type PhoneOtpProvider,
  type SessionPreparer,
} from "../../../../../apps/web/src/server/auth/phone/phone-auth.types";
import {
  PhoneOtpApplicationErrorCode,
  PhoneOtpService,
} from "../../../../../apps/web/src/server/auth/phone/phone-otp-service";

const now = new Date("2026-09-18T12:00:00.000Z");
const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
const attemptId = "201b85c4-0dd3-47e2-a15e-7687707f3bf6";
const binding = "b".repeat(43);
const sessionToken = "s".repeat(43);

function challengeStore(): PhoneOtpChallengeStore {
  return {
    createRateLimited: vi.fn(async (): Promise<CreatePhoneOtpChallengeResult> => ({
      status: PhoneOtpChallengeCreationStatus.Created,
      challenge: {
        id: challengeId,
        expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      },
    })),
    markSent: vi.fn(async () => true),
    markSendFailed: vi.fn(async () => true),
    claimVerification: vi.fn(
      async (): Promise<ClaimPhoneOtpVerificationResult> => ({
      status: PhoneOtpVerificationClaimStatus.Claimed,
      attemptId,
      phoneNumber: "+919876543210",
      providerAlreadyVerified: false,
      }),
    ),
    recordInvalid: vi.fn(async () => true),
    recordExpired: vi.fn(async () => true),
    recordProviderVerified: vi.fn(async () => true),
    recordProviderError: vi.fn(async () => true),
  };
}

function completionStore(): PhoneOtpCompletionStore {
  return {
    complete: vi.fn(async (): Promise<PhoneOtpCompletionResult> => ({
      status: PhoneOtpCompletionStatus.Resolved,
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date("2026-10-18T12:00:00.000Z"),
        user: {
          id: "user-1",
          displayName: null,
          primaryEmail: null,
          primaryPhone: "+919876543210",
        },
      },
    })),
  };
}

function provider(): PhoneOtpProvider {
  return {
    send: vi.fn(async () => ({ providerRequestId: "provider-request-1" })),
    verify: vi.fn(async () => ({
      status: PhoneOtpProviderVerificationStatus.Verified,
    })),
  };
}

function sessionPreparer(): SessionPreparer {
  return {
    prepareIssue: vi.fn(() => ({
      token: sessionToken,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: new Date("2026-10-18T12:00:00.000Z"),
    })),
  };
}

function service(
  challenges: PhoneOtpChallengeStore = challengeStore(),
  completions: PhoneOtpCompletionStore = completionStore(),
  otpProvider: PhoneOtpProvider = provider(),
): PhoneOtpService {
  return new PhoneOtpService(
    challenges,
    completions,
    otpProvider,
    sessionPreparer(),
    new SensitiveIdentifierHasher("k".repeat(32)),
    {
      challengeTtlSeconds: 600,
      rateLimitWindowSeconds: 600,
      sendMaxPerPhone: 3,
      sendMaxPerIp: 10,
      verifyMaxPerChallenge: 5,
      verifyMaxPerIp: 30,
      now: () => now,
      generateBrowserBinding: () => binding,
    },
  );
}

describe("PhoneOtpService", () => {
  it("creates a rate-limited challenge before sending through the provider", async () => {
    const challenges = challengeStore();
    const otpProvider = provider();
    const result = await service(challenges, completionStore(), otpProvider).start(
      { phoneNumber: "98765 43210" },
      "203.0.113.10",
    );

    expect(result).toEqual({
      challengeId,
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      browserBinding: binding,
    });
    expect(challenges.createRateLimited).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: "+919876543210",
        maxPerPhone: 3,
        maxPerIp: 10,
      }),
    );
    expect(otpProvider.send).toHaveBeenCalledWith("+919876543210");
  });

  it("surfaces persisted rate limits without calling MSG91", async () => {
    const challenges = challengeStore();
    vi.mocked(challenges.createRateLimited).mockResolvedValue({
      status: PhoneOtpChallengeCreationStatus.RateLimited,
      retryAt: new Date("2026-09-18T12:00:30.000Z"),
    });
    const otpProvider = provider();

    await expect(
      service(challenges, completionStore(), otpProvider).start(
        { phoneNumber: "+919876543210" },
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({
      code: PhoneOtpApplicationErrorCode.RateLimited,
      retryAfterSeconds: 30,
    });
    expect(otpProvider.send).not.toHaveBeenCalled();
  });

  it("verifies with MSG91 and atomically completes identity plus session", async () => {
    const challenges = challengeStore();
    const completions = completionStore();
    const otpProvider = provider();
    const result = await service(challenges, completions, otpProvider).verify(
      { challengeId, phoneNumber: "+919876543210", otp: "123456" },
      binding,
      "203.0.113.10",
    );

    expect(result.token).toBe(sessionToken);
    expect(otpProvider.verify).toHaveBeenCalledWith(
      "+919876543210",
      "123456",
    );
    expect(challenges.recordProviderVerified).toHaveBeenCalledWith(
      challengeId,
      attemptId,
      now,
    );
    expect(completions.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId,
        attemptId,
        phoneNumber: "+919876543210",
      }),
    );
  });

  it("records invalid OTPs without preparing a session", async () => {
    const challenges = challengeStore();
    const otpProvider = provider();
    vi.mocked(otpProvider.verify).mockResolvedValue({
      status: PhoneOtpProviderVerificationStatus.Invalid,
    });
    const sessions = sessionPreparer();
    const otpService = new PhoneOtpService(
      challenges,
      completionStore(),
      otpProvider,
      sessions,
      new SensitiveIdentifierHasher("k".repeat(32)),
      {
        challengeTtlSeconds: 600,
        rateLimitWindowSeconds: 600,
        sendMaxPerPhone: 3,
        sendMaxPerIp: 10,
        verifyMaxPerChallenge: 5,
        verifyMaxPerIp: 30,
        now: () => now,
      },
    );

    await expect(
      otpService.verify(
        { challengeId, phoneNumber: "+919876543210", otp: "000000" },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({ code: PhoneOtpApplicationErrorCode.InvalidOtp });
    expect(challenges.recordInvalid).toHaveBeenCalledWith(
      challengeId,
      attemptId,
      now,
    );
    expect(sessions.prepareIssue).not.toHaveBeenCalled();
  });
});
