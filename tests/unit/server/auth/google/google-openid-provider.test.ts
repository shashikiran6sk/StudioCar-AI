import { afterEach, describe, expect, it, vi } from "vitest";
import { Configuration } from "openid-client";

import { GoogleOpenIdProvider } from "../../../../../apps/web/src/server/auth/google/google-openid-provider";

const openIdMocks = vi.hoisted(() => ({
  authorizationCodeGrant: vi.fn(),
  calculatePKCECodeChallenge: vi.fn(),
  discovery: vi.fn(),
  randomNonce: vi.fn(),
  randomPKCECodeVerifier: vi.fn(),
  randomState: vi.fn(),
}));

vi.mock("openid-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("openid-client")>();
  return {
    ...original,
    ...openIdMocks,
  };
});

const clientId = "google-client";
const clientSecret = "google-secret";
const redirectUri = "https://app.studiocar.test/api/auth/google/callback";
const state = "s".repeat(43);
const nonce = "n".repeat(43);
const codeVerifier = "v".repeat(43);
const now = new Date("2026-09-18T12:00:00.000Z");
const configuration = new Configuration(
  {
    issuer: "https://accounts.google.com",
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
  },
  clientId,
  clientSecret,
);

describe("GoogleOpenIdProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds an authorization-code request with PKCE, state, and nonce", async () => {
    openIdMocks.discovery.mockResolvedValue(configuration);
    openIdMocks.randomState.mockReturnValue(state);
    openIdMocks.randomNonce.mockReturnValue(nonce);
    openIdMocks.randomPKCECodeVerifier.mockReturnValue(codeVerifier);
    openIdMocks.calculatePKCECodeChallenge.mockResolvedValue("pkce-challenge");
    const provider = new GoogleOpenIdProvider({
      clientId,
      clientSecret,
      redirectUri,
      now: () => now,
    });

    const result = await provider.createAuthorizationRequest();

    expect(result).toMatchObject({ state, nonce, codeVerifier });
    expect(result.authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(result.authorizationUrl.searchParams.get("response_type")).toBe("code");
    expect(result.authorizationUrl.searchParams.get("scope")).toBe("openid email profile");
    expect(result.authorizationUrl.searchParams.get("state")).toBe(state);
    expect(result.authorizationUrl.searchParams.get("nonce")).toBe(nonce);
    expect(result.authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(result.authorizationUrl.searchParams.get("code_challenge")).toBe(
      "pkce-challenge",
    );
  });

  it("exchanges the code with all checks and returns verified identity claims", async () => {
    openIdMocks.discovery.mockResolvedValue(configuration);
    const claims = {
      iss: "https://accounts.google.com",
      sub: "google-subject",
      aud: clientId,
      iat: Math.floor(now.getTime() / 1_000),
      exp: Math.floor(now.getTime() / 1_000) + 600,
      nonce,
      email: "dealer@studiocar.test",
      email_verified: true,
      name: "Studio Dealer",
    };
    openIdMocks.authorizationCodeGrant.mockResolvedValue({
      access_token: "access-token",
      token_type: "bearer",
      claims: () => claims,
      expiresIn: () => 600,
    });
    const provider = new GoogleOpenIdProvider({
      clientId,
      clientSecret,
      redirectUri,
      now: () => now,
    });
    const callbackUrl = new URL(`${redirectUri}?code=code&state=${state}`);

    await expect(
      provider.exchangeAuthorizationCode(
        callbackUrl,
        { codeVerifier, nonce },
        state,
      ),
    ).resolves.toEqual({
      providerSubject: "google-subject",
      email: "dealer@studiocar.test",
      displayName: "Studio Dealer",
    });
    expect(openIdMocks.authorizationCodeGrant).toHaveBeenCalledWith(configuration, callbackUrl, {
      expectedState: state,
      expectedNonce: nonce,
      pkceCodeVerifier: codeVerifier,
      idTokenExpected: true,
    });
  });

  it("retries discovery after a transient discovery failure", async () => {
    openIdMocks.discovery
      .mockRejectedValueOnce(new Error("temporary discovery failure"))
      .mockResolvedValueOnce(configuration);
    openIdMocks.randomState.mockReturnValue(state);
    openIdMocks.randomNonce.mockReturnValue(nonce);
    openIdMocks.randomPKCECodeVerifier.mockReturnValue(codeVerifier);
    openIdMocks.calculatePKCECodeChallenge.mockResolvedValue("pkce-challenge");
    const provider = new GoogleOpenIdProvider({
      clientId,
      clientSecret,
      redirectUri,
      now: () => now,
    });

    await expect(provider.createAuthorizationRequest()).rejects.toThrow(
      "temporary discovery failure",
    );
    await expect(provider.createAuthorizationRequest()).resolves.toMatchObject({
      state,
    });
    expect(openIdMocks.discovery).toHaveBeenCalledTimes(2);
  });
});
