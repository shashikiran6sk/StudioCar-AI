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
  PhoneOtpIdentificationStatus,
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
const accessToken = "signed.widget.access-token";

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
      }),
    ),
    recordInvalid: vi.fn(async () => true),
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
    driver: "msg91",
    identify: vi.fn(async () => ({
      status: PhoneOtpIdentificationStatus.Verified as const,
      identifier: "919876543210",
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
  sessions: SessionPreparer = sessionPreparer(),
): PhoneOtpService {
  return new PhoneOtpService(
    challenges,
    completions,
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
      generateBrowserBinding: () => binding,
    },
  );
}

describe("PhoneOtpService start", () => {
  it("creates a rate-limited challenge without spending a provider message", async () => {
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
    // The widget sends the message from the browser.
    expect(otpProvider.identify).not.toHaveBeenCalled();
  });

  it("surfaces persisted send rate limits with a retry hint", async () => {
    const challenges = challengeStore();
    vi.mocked(challenges.createRateLimited).mockResolvedValue({
      status: PhoneOtpChallengeCreationStatus.RateLimited,
      retryAt: new Date("2026-09-18T12:00:30.000Z"),
    });

    await expect(
      service(challenges).start({ phoneNumber: "+919876543210" }, "203.0.113.10"),
    ).rejects.toMatchObject({
      code: PhoneOtpApplicationErrorCode.RateLimited,
      retryAfterSeconds: 30,
    });
    expect(challenges.markSent).not.toHaveBeenCalled();
  });
});

describe("PhoneOtpService verify", () => {
  it("verifies the widget access token and completes identity plus session", async () => {
    const challenges = challengeStore();
    const completions = completionStore();
    const otpProvider = provider();
    const result = await service(challenges, completions, otpProvider).verify(
      { challengeId, phoneNumber: "+919876543210", accessToken },
      binding,
      "203.0.113.10",
    );

    expect(result.token).toBe(sessionToken);
    expect(otpProvider.identify).toHaveBeenCalledWith(accessToken);
    expect(challenges.recordProviderVerified).toHaveBeenCalledWith(
      challengeId,
      attemptId,
      expect.stringMatching(/^[0-9a-f]{64}$/),
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

  it("never sends the access token itself to the challenge store", async () => {
    const challenges = challengeStore();
    await service(challenges).verify(
      { challengeId, phoneNumber: "+919876543210", accessToken },
      binding,
      "203.0.113.10",
    );

    const recorded = vi.mocked(challenges.recordProviderVerified).mock.calls[0];
    expect(recorded?.[2]).not.toContain(accessToken);
  });

  it("refuses a token that proves a different handset", async () => {
    const challenges = challengeStore();
    const otpProvider = provider();
    vi.mocked(otpProvider.identify).mockResolvedValue({
      status: PhoneOtpIdentificationStatus.Verified,
      identifier: "919999999999",
    });
    const sessions = sessionPreparer();

    await expect(
      service(challenges, completionStore(), otpProvider, sessions).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
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

  it("answers a rejected token exactly as it answers a mismatched one", async () => {
    const challenges = challengeStore();
    const otpProvider = provider();
    vi.mocked(otpProvider.identify).mockResolvedValue({
      status: PhoneOtpIdentificationStatus.Rejected,
    });
    const sessions = sessionPreparer();

    await expect(
      service(challenges, completionStore(), otpProvider, sessions).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({ code: PhoneOtpApplicationErrorCode.InvalidOtp });
    expect(sessions.prepareIssue).not.toHaveBeenCalled();
  });

  it("distinguishes an unreachable provider from a refused token", async () => {
    const challenges = challengeStore();
    const otpProvider = provider();
    vi.mocked(otpProvider.identify).mockResolvedValue({
      status: PhoneOtpIdentificationStatus.Unavailable,
    });

    await expect(
      service(challenges, completionStore(), otpProvider).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({
      code: PhoneOtpApplicationErrorCode.ProviderUnavailable,
    });
    expect(challenges.recordProviderError).toHaveBeenCalledWith(
      challengeId,
      attemptId,
      now,
    );
    expect(challenges.recordInvalid).not.toHaveBeenCalled();
  });

  it("refuses a replayed access token that another challenge already claimed", async () => {
    const challenges = challengeStore();
    vi.mocked(challenges.recordProviderVerified).mockResolvedValue(false);
    const sessions = sessionPreparer();

    await expect(
      service(challenges, completionStore(), provider(), sessions).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({ code: PhoneOtpApplicationErrorCode.InvalidOtp });
    expect(sessions.prepareIssue).not.toHaveBeenCalled();
  });

  it("reports an expired challenge before contacting the provider", async () => {
    const challenges = challengeStore();
    vi.mocked(challenges.claimVerification).mockResolvedValue({
      status: PhoneOtpVerificationClaimStatus.Expired,
    });
    const otpProvider = provider();

    await expect(
      service(challenges, completionStore(), otpProvider).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({ code: PhoneOtpApplicationErrorCode.Expired });
    expect(otpProvider.identify).not.toHaveBeenCalled();
  });

  it("stops at the per-challenge attempt cap", async () => {
    const challenges = challengeStore();
    vi.mocked(challenges.claimVerification).mockResolvedValue({
      status: PhoneOtpVerificationClaimStatus.TooManyAttempts,
    });
    const otpProvider = provider();

    await expect(
      service(challenges, completionStore(), otpProvider).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({
      code: PhoneOtpApplicationErrorCode.TooManyAttempts,
    });
    expect(otpProvider.identify).not.toHaveBeenCalled();
  });

  it("reports an identity that already belongs to another account", async () => {
    const completions = completionStore();
    vi.mocked(completions.complete).mockResolvedValue({
      status: PhoneOtpCompletionStatus.LinkRequired,
    });

    await expect(
      service(challengeStore(), completions).verify(
        { challengeId, phoneNumber: "+919876543210", accessToken },
        binding,
        "203.0.113.10",
      ),
    ).rejects.toMatchObject({
      code: PhoneOtpApplicationErrorCode.IdentityLinkRequired,
    });
  });
});
