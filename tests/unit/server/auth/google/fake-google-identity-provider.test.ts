// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { GoogleIdentityResolutionStatus } from "../../../../../packages/contracts/src/auth";
import { FakeGoogleIdentityProvider } from "../../../../../apps/web/src/server/auth/google/fake-google-identity-provider";
import type {
  GoogleIdentity,
  GoogleIdentityStore,
  GoogleOAuthChallengeStore,
} from "../../../../../apps/web/src/server/auth/google/google-auth.types";
import { GoogleOAuthService } from "../../../../../apps/web/src/server/auth/google/google-oauth-service";
import type { IssuedSession } from "../../../../../apps/web/src/server/auth/session-service";
import { OAuthChallengeProtector } from "../../../../../apps/web/src/server/auth/oauth-challenge-protector";

const REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
const SESSION_SECRET = "local-development-session-secret-000000";

function inMemoryChallengeStore(): GoogleOAuthChallengeStore {
  const challenges = new Map<string, { protectedPayload: string; returnTo: string }>();
  return {
    create: vi.fn((command: { stateHash: string; protectedPayload: string; returnTo: string }) => {
      challenges.set(command.stateHash, command);
      return Promise.resolve(undefined);
    }),
    consume: vi.fn((stateHash: string) => {
      const challenge = challenges.get(stateHash) ?? null;
      challenges.delete(stateHash);
      return Promise.resolve(challenge);
    }),
  };
}

describe("FakeGoogleIdentityProvider", () => {
  it("sends the browser straight back to the application's own callback", async () => {
    const provider = new FakeGoogleIdentityProvider({ redirectUri: REDIRECT_URI });
    const request = await provider.createAuthorizationRequest();

    expect(`${request.authorizationUrl.origin}${request.authorizationUrl.pathname}`).toBe(
      REDIRECT_URI,
    );
    expect(request.authorizationUrl.searchParams.get("state")).toBe(request.state);
    expect(request.authorizationUrl.searchParams.get("code")).toBeTruthy();
    expect(request.authorizationUrl.hostname).not.toContain("google");
  });

  it("resolves the fixed local identity for its own authorization code", async () => {
    const provider = new FakeGoogleIdentityProvider({ redirectUri: REDIRECT_URI });
    const request = await provider.createAuthorizationRequest();

    await expect(
      provider.exchangeAuthorizationCode(
        request.authorizationUrl,
        { codeVerifier: request.codeVerifier, nonce: request.nonce },
        request.state,
      ),
    ).resolves.toEqual({
      providerSubject: "studiocar-local-developer",
      email: "developer@studiocar.local",
      displayName: "StudioCar Developer",
    });
  });

  it("refuses a code that belongs to another challenge", async () => {
    const provider = new FakeGoogleIdentityProvider({ redirectUri: REDIRECT_URI });
    const first = await provider.createAuthorizationRequest();
    const second = await provider.createAuthorizationRequest();

    await expect(
      provider.exchangeAuthorizationCode(
        first.authorizationUrl,
        { codeVerifier: second.codeVerifier, nonce: second.nonce },
        first.state,
      ),
    ).rejects.toThrow(/does not match its challenge/);
  });

  it("refuses a callback whose state differs from the challenge", async () => {
    const provider = new FakeGoogleIdentityProvider({ redirectUri: REDIRECT_URI });
    const request = await provider.createAuthorizationRequest();

    await expect(
      provider.exchangeAuthorizationCode(
        request.authorizationUrl,
        { codeVerifier: request.codeVerifier, nonce: request.nonce },
        "another-state-value-that-was-never-issued-00",
      ),
    ).rejects.toThrow(/does not match its challenge/);
  });

  it("completes the ordinary challenge, identity, and session flow", async () => {
    const resolved: GoogleIdentity[] = [];
    const identities: GoogleIdentityStore = {
      resolve: vi.fn((identity: GoogleIdentity) => {
        resolved.push(identity);
        return Promise.resolve({
          status: GoogleIdentityResolutionStatus.Resolved,
          user: {
            id: "local-user",
            displayName: identity.displayName,
            primaryEmail: identity.email,
            primaryPhone: null,
          },
          created: true,
        });
      }),
    };
    const expiresAt = new Date("2026-10-01T00:00:00.000Z");
    const issued: IssuedSession = {
      token: "session-token",
      expiresAt,
      session: {
        id: "session-id",
        userId: "local-user",
        expiresAt,
        user: {
          id: "local-user",
          displayName: "StudioCar Developer",
          primaryEmail: "developer@studiocar.local",
          primaryPhone: null,
        },
      },
    };
    const issue = vi.fn((_userId: string) => Promise.resolve(issued));
    const service = new GoogleOAuthService(
      inMemoryChallengeStore(),
      identities,
      { linkGoogle: vi.fn() },
      new FakeGoogleIdentityProvider({ redirectUri: REDIRECT_URI }),
      new OAuthChallengeProtector(SESSION_SECRET),
      {
        issue,
        prepareIssue: vi.fn(() => ({
          token: "t".repeat(43),
          tokenHash: "h".repeat(64),
          expiresAt,
        })),
      },
      { evaluate: vi.fn(() => Promise.resolve(undefined)) },
      { findVerified: vi.fn(async () => null) },
      { resolve: vi.fn() },
      { challengeTtlSeconds: 600 },
    );

    const started = await service.start({ returnTo: "/dashboard" });
    const completion = await service.complete({
      callbackUrl: started.authorizationUrl,
      state: started.state,
      sessionUserId: null,
    });

    expect(completion).toMatchObject({ kind: "SIGNED_IN", returnTo: "/dashboard" });
    expect(resolved).toEqual([
      expect.objectContaining({ email: "developer@studiocar.local" }),
    ]);
    expect(issue).toHaveBeenCalledWith("local-user");

    // The challenge is one-time: replaying the same callback is refused.
    await expect(
      service.complete({
        callbackUrl: started.authorizationUrl,
        state: started.state,
        sessionUserId: null,
      }),
    ).rejects.toThrow(/challenge_invalid/);
  });
});
