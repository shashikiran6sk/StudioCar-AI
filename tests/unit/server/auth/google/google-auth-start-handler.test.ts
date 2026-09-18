import { describe, expect, it, vi } from "vitest";

import { handleGoogleAuthStart } from "../../../../../apps/web/src/server/auth/google/google-auth-start-handler";
import type { GoogleOAuthApplication } from "../../../../../apps/web/src/server/auth/google/google-auth.types";

function application(): GoogleOAuthApplication {
  return {
    start: vi.fn(async () => ({
      authorizationUrl: new URL("https://accounts.google.com/o/oauth2/v2/auth"),
      state: "s".repeat(43),
      expiresAt: new Date("2026-09-18T12:10:00.000Z"),
    })),
    complete: vi.fn(),
  };
}

describe("handleGoogleAuthStart", () => {
  it("validates the return path before starting authentication", async () => {
    const auth = application();
    const response = await handleGoogleAuthStart(
      new Request(
        "https://app.studiocar.test/api/auth/google/start?returnTo=https://attacker.example",
      ),
      auth,
      false,
      () => "request-123",
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "BAD_REQUEST", requestId: "request-123" },
    });
    expect(auth.start).not.toHaveBeenCalled();
  });

  it("redirects to the provider after persisting an application-relative target", async () => {
    const auth = application();
    const response = await handleGoogleAuthStart(
      new Request(
        "https://app.studiocar.test/api/auth/google/start?returnTo=%2Finventory",
      ),
      auth,
      true,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(auth.start).toHaveBeenCalledWith({ returnTo: "/inventory" });
    expect(response.headers.get("set-cookie")).toContain(
      "__Host-studiocar_google_oauth=ssss",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
