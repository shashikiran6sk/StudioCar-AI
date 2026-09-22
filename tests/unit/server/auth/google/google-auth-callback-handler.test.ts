import { describe, expect, it, vi } from "vitest";

import { handleGoogleAuthCallback } from "../../../../../apps/web/src/server/auth/google/google-auth-callback-handler";
import type { GoogleOAuthApplication } from "../../../../../apps/web/src/server/auth/google/google-auth.types";
import {
  GoogleOAuthCompletionError,
  GoogleOAuthCompletionErrorCode,
} from "../../../../../apps/web/src/server/auth/google/google-oauth-service";

const state = "s".repeat(43);
const callbackUrl = `https://app.studiocar.test/api/auth/google/callback?code=code&state=${state}`;

function callbackRequest(url: string = callbackUrl): Request {
  return new Request(url, {
    headers: { cookie: `studiocar_google_oauth=${state}` },
  });
}

function application(): GoogleOAuthApplication {
  return {
    start: vi.fn(),
    complete: vi.fn(async () => ({
      kind: "SIGNED_IN" as const,
      returnTo: "/inventory",
      issuedSession: {
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
      },
    })),
  };
}

describe("handleGoogleAuthCallback", () => {
  it("sets a secure opaque session cookie and redirects to the saved path", async () => {
    const auth = application();
    const response = await handleGoogleAuthCallback(
      new Request(callbackUrl, {
        headers: { cookie: `__Host-studiocar_google_oauth=${state}` },
      }),
      auth,
      true,
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://app.studiocar.test/inventory",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-studiocar_session=tttt",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });

  it("does not exchange codes for malformed or denied callbacks", async () => {
    const auth = application();
    const malformed = await handleGoogleAuthCallback(
      callbackRequest("https://app.studiocar.test/api/auth/google/callback?code=code"),
      auth,
      false,
    );
    const denied = await handleGoogleAuthCallback(
      callbackRequest(
        `https://app.studiocar.test/api/auth/google/callback?error=access_denied&state=${state}`,
      ),
      auth,
      false,
    );

    expect(malformed.headers.get("location")).toContain("code=invalid_callback");
    expect(denied.headers.get("location")).toContain("code=access_denied");
    expect(auth.complete).not.toHaveBeenCalled();
  });

  it("maps account-linking conflicts to a stable non-sensitive error", async () => {
    const auth = application();
    vi.mocked(auth.complete).mockRejectedValue(
      new GoogleOAuthCompletionError(
        GoogleOAuthCompletionErrorCode.IdentityLinkRequired,
      ),
    );

    const response = await handleGoogleAuthCallback(
      callbackRequest(),
      auth,
      false,
    );

    expect(response.headers.get("location")).toContain(
      "code=identity_link_required",
    );
  });

  it("rejects a valid callback that was initiated in another browser", async () => {
    const auth = application();
    const response = await handleGoogleAuthCallback(
      new Request(callbackUrl),
      auth,
      false,
    );

    expect(response.headers.get("location")).toContain("code=invalid_callback");
    expect(auth.complete).not.toHaveBeenCalled();
  });
});
