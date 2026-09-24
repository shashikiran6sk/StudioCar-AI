import { describe, expect, it, vi } from "vitest";
import { GoogleIdentityResolutionStatus } from "../../../../../packages/contracts/src/auth";

import { hashAuthSecret } from "../../../../../apps/web/src/server/auth/hash-auth-secret";
import type {
  GoogleIdentityProvider,
  GoogleIdentityResolution,
  GoogleIdentityStore,
  GoogleOAuthChallengeStore,
  GoogleOAuthPayloadProtector,
  SessionIssuer,
  VerifiedPhoneGoogleStore,
} from "../../../../../apps/web/src/server/auth/google/google-auth.types";
import type { PhoneAccountRepositoryPort } from "../../../../../apps/web/src/server/auth/phone/phone-account.types";
import {
  GoogleOAuthCompletionError,
  GoogleOAuthCompletionErrorCode,
  GoogleOAuthService,
} from "../../../../../apps/web/src/server/auth/google/google-oauth-service";

const now = new Date("2026-09-18T12:00:00.000Z");
const state = "s".repeat(43);
const codeVerifier = "v".repeat(43);
const nonce = "n".repeat(43);
const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
const callbackUrl = new URL(
  `https://app.studiocar.test/api/auth/google/callback?code=code&state=${state}`,
);

function dependencies(overrides?: {
  consumedChallenge?: { protectedPayload: string; returnTo: string } | null;
  identityStatus?: "resolved" | "link_required";
}) {
  const challengeStore: GoogleOAuthChallengeStore = {
    create: vi.fn(async () => undefined),
    consume: vi.fn(async () =>
      overrides?.consumedChallenge === undefined
        ? { protectedPayload: "protected-payload", returnTo: "/inventory" }
        : overrides.consumedChallenge,
    ),
  };
  const provider: GoogleIdentityProvider = {
    createAuthorizationRequest: vi.fn(async () => ({
      authorizationUrl,
      state,
      codeVerifier,
      nonce,
    })),
    exchangeAuthorizationCode: vi.fn(async () => ({
      providerSubject: "google-subject",
      email: "dealer@studiocar.test",
      displayName: "Studio Dealer",
    })),
  };
  const protector: GoogleOAuthPayloadProtector = {
    protect: vi.fn(() => "protected-payload"),
    unprotect: vi.fn(() => ({ codeVerifier, nonce })),
  };
  const identityStore: GoogleIdentityStore = {
    resolve: vi.fn(async () => {
      const resolution: GoogleIdentityResolution =
        overrides?.identityStatus === "link_required"
        ? { status: GoogleIdentityResolutionStatus.LinkRequired }
        : {
            status: GoogleIdentityResolutionStatus.Resolved,
            user: {
              id: "user-1",
              displayName: "Studio Dealer",
              primaryEmail: "dealer@studiocar.test",
              primaryPhone: null,
            },
          };
      return resolution;
    }),
  };
  const sessions: SessionIssuer = {
    prepareIssue: vi.fn(() => ({
      token: "t".repeat(43),
      tokenHash: "h".repeat(64),
      expiresAt: new Date("2026-10-18T12:00:00.000Z"),
    })),
    issue: vi.fn(async () => ({
      token: "t".repeat(43),
      expiresAt: new Date("2026-10-18T12:00:00.000Z"),
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date("2026-10-18T12:00:00.000Z"),
        user: {
          id: "user-1",
          displayName: "Studio Dealer",
          primaryEmail: "dealer@studiocar.test",
          primaryPhone: null,
        },
      },
    })),
  };

  return {
    challengeStore,
    provider,
    protector,
    identityStore,
    linkStore: { linkGoogle: vi.fn() },
    adminBootstrap: { evaluate: vi.fn() },
    phoneAccounts: {
      findVerified: vi.fn<PhoneAccountRepositoryPort["findVerified"]>(
        async () => null,
      ),
    },
    phoneGoogle: { resolve: vi.fn<VerifiedPhoneGoogleStore["resolve"]>() },
    sessions,
  };
}

function service(
  values: ReturnType<typeof dependencies>,
): GoogleOAuthService {
  return new GoogleOAuthService(
    values.challengeStore,
    values.identityStore,
    values.linkStore,
    values.provider,
    values.protector,
    values.sessions,
    values.adminBootstrap,
    values.phoneAccounts,
    values.phoneGoogle,
    { challengeTtlSeconds: 600, now: () => now },
  );
}

describe("GoogleOAuthService", () => {
  it("protects a browser-bound verified-phone intent before starting Google OAuth", async () => {
    const values = dependencies();
    vi.mocked(values.phoneAccounts.findVerified).mockResolvedValue({
      phoneNumber: "+919876543210",
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    });
    const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
    await service(values).start({
      returnTo: "/dashboard",
      verifiedPhone: { challengeId, browserBinding: "binding" },
    });
    expect(values.phoneAccounts.findVerified).toHaveBeenCalledWith({
      challengeId,
      browserBindingHash: hashAuthSecret("binding"),
      now,
    });
    expect(values.protector.protect).toHaveBeenCalledWith({
      codeVerifier,
      nonce,
      phoneChallengeId: challengeId,
    });
    expect(authorizationUrl.toString()).not.toContain(challengeId);
  });

  it("signs in the transactional Google-plus-phone account without resolving a second user", async () => {
    const values = dependencies();
    const challengeId = "4f9d4891-157f-49ed-aa5a-c026abc0a768";
    vi.mocked(values.protector.unprotect).mockReturnValue({
      codeVerifier,
      nonce,
      phoneChallengeId: challengeId,
    });
    vi.mocked(values.phoneGoogle.resolve).mockResolvedValue({
      kind: "RESOLVED",
      session: {
        id: "session-2",
        userId: "user-2",
        expiresAt: new Date("2026-10-18T12:00:00.000Z"),
        user: {
          id: "user-2",
          displayName: "Studio Dealer",
          primaryEmail: "dealer@studiocar.test",
          primaryPhone: "+919876543210",
        },
      },
    });
    const completed = await service(values).complete({
      callbackUrl,
      state,
      sessionUserId: null,
      phoneBrowserBinding: "binding",
    });
    expect(completed.kind).toBe("PHONE_LINKED_SIGNED_IN");
    expect(values.phoneGoogle.resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        challengeId,
        browserBindingHash: hashAuthSecret("binding"),
      }),
    );
    expect(values.identityStore.resolve).not.toHaveBeenCalled();
    expect(values.sessions.issue).not.toHaveBeenCalled();
  });

  it("fails if verified-phone state expires during OAuth", async () => {
    const values = dependencies();
    vi.mocked(values.protector.unprotect).mockReturnValue({
      codeVerifier,
      nonce,
      phoneChallengeId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
    });
    vi.mocked(values.phoneGoogle.resolve).mockResolvedValue({
      kind: "INVALID_VERIFICATION",
    });
    await expect(service(values).complete({
      callbackUrl,
      state,
      sessionUserId: null,
      phoneBrowserBinding: "binding",
    })).rejects.toMatchObject({
      code: GoogleOAuthCompletionErrorCode.VerifiedPhoneExpired,
    });
  });

  it("stores only a state hash and protected PKCE challenge", async () => {
    const values = dependencies();

    await expect(service(values).start({ returnTo: "/inventory" })).resolves.toEqual({
      authorizationUrl,
      state,
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    });
    expect(values.challengeStore.create).toHaveBeenCalledWith({
      stateHash: hashAuthSecret(state),
      protectedPayload: "protected-payload",
      returnTo: "/inventory",
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    });
    expect(JSON.stringify(vi.mocked(values.challengeStore.create).mock.calls)).not.toContain(
      state,
    );
  });

  it("consumes the challenge, resolves the canonical identity, and issues a session", async () => {
    const values = dependencies();

    const completed = await service(values).complete({ sessionUserId: null, callbackUrl, state });

    expect(values.challengeStore.consume).toHaveBeenCalledWith(hashAuthSecret(state), now);
    expect(values.provider.exchangeAuthorizationCode).toHaveBeenCalledWith(
      callbackUrl,
      { codeVerifier, nonce },
      state,
    );
    expect(values.identityStore.resolve).toHaveBeenCalledWith(
      {
        providerSubject: "google-subject",
        email: "dealer@studiocar.test",
        displayName: "Studio Dealer",
      },
      now,
    );
    expect(values.sessions.issue).toHaveBeenCalledWith("user-1");
    expect(completed.returnTo).toBe("/inventory");
  });

  it("fails closed when a challenge is missing or already consumed", async () => {
    const values = dependencies({ consumedChallenge: null });

    await expect(service(values).complete({ sessionUserId: null, callbackUrl, state })).rejects.toMatchObject({
      code: GoogleOAuthCompletionErrorCode.ChallengeInvalid,
    });
    expect(values.provider.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("requires an explicit link when a verified email belongs to another user", async () => {
    const values = dependencies({ identityStatus: "link_required" });

    await expect(service(values).complete({ sessionUserId: null, callbackUrl, state })).rejects.toEqual(
      new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.IdentityLinkRequired,
      ),
    );
    expect(values.sessions.issue).not.toHaveBeenCalled();
  });
});

describe("GoogleOAuthService linking", () => {
  const linkedIdentity = {
    providerSubject: "google-subject-1",
    email: "owner@example.com",
    displayName: "Owner",
  };

  function linkingDependencies(linkUserId: string) {
    const values = dependencies();
    values.protector.unprotect = vi.fn(() => ({
      codeVerifier: "v".repeat(43),
      nonce: "n".repeat(43),
      linkUserId,
    }));
    values.provider.exchangeAuthorizationCode = vi.fn(
      async () => linkedIdentity,
    );
    return values;
  }

  it("carries the link intent inside the encrypted challenge, not the URL", async () => {
    const values = dependencies();
    await service(values).start({
      returnTo: "/settings/profile",
      linkUserId: "user-1",
    });

    expect(values.protector.protect).toHaveBeenCalledWith(
      expect.objectContaining({ linkUserId: "user-1" }),
    );
  });

  it("connects Google without issuing a new session", async () => {
    const values = linkingDependencies("user-1");
    values.linkStore.linkGoogle.mockResolvedValue({ status: "linked" });

    await expect(
      service(values).complete({
        callbackUrl: new URL("https://app.studiocar.test/callback?code=c"),
        state: "s".repeat(43),
        sessionUserId: "user-1",
      }),
    ).resolves.toMatchObject({ kind: "LINKED", returnTo: "/inventory" });
    expect(values.sessions.issue).not.toHaveBeenCalled();
    expect(values.identityStore.resolve).not.toHaveBeenCalled();
  });

  it("refuses when a different session completes the link", async () => {
    const values = linkingDependencies("user-1");

    await expect(
      service(values).complete({
        callbackUrl: new URL("https://app.studiocar.test/callback?code=c"),
        state: "s".repeat(43),
        sessionUserId: "user-2",
      }),
    ).rejects.toMatchObject({ code: "link_session_mismatch" });
    expect(values.linkStore.linkGoogle).not.toHaveBeenCalled();
  });

  it("refuses when no session completes the link", async () => {
    const values = linkingDependencies("user-1");

    await expect(
      service(values).complete({
        callbackUrl: new URL("https://app.studiocar.test/callback?code=c"),
        state: "s".repeat(43),
        sessionUserId: null,
      }),
    ).rejects.toMatchObject({ code: "link_session_mismatch" });
    expect(values.linkStore.linkGoogle).not.toHaveBeenCalled();
  });

  it("refuses an identity that already belongs to another account", async () => {
    const values = linkingDependencies("user-1");
    values.linkStore.linkGoogle.mockResolvedValue({ status: "identity_taken" });

    await expect(
      service(values).complete({
        callbackUrl: new URL("https://app.studiocar.test/callback?code=c"),
        state: "s".repeat(43),
        sessionUserId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "link_identity_taken" });
  });

  it("treats an already-connected identity as a completed link", async () => {
    const values = linkingDependencies("user-1");
    values.linkStore.linkGoogle.mockResolvedValue({ status: "already_linked" });

    await expect(
      service(values).complete({
        callbackUrl: new URL("https://app.studiocar.test/callback?code=c"),
        state: "s".repeat(43),
        sessionUserId: "user-1",
      }),
    ).resolves.toMatchObject({ kind: "LINKED" });
  });
});
