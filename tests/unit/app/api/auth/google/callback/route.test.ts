import { describe, expect, it, vi } from "vitest";

import type { GoogleOAuthApplication } from "../../../../../../../apps/web/src/server/auth/google/google-auth.types";
import { getGoogleOAuthApplication } from "../../../../../../../apps/web/src/server/auth/google/google-auth-runtime";
import { GET } from "../../../../../../../apps/web/src/app/api/auth/google/callback/route";

vi.mock("../../../../../../../apps/web/src/server/auth/google/google-auth-runtime", () => ({
  getGoogleOAuthApplication: vi.fn(),
}));

const state = "s".repeat(43);

describe("GET /api/auth/google/callback", () => {
  it("delegates the callback and returns the application session redirect", async () => {
    const application: GoogleOAuthApplication = {
      start: vi.fn(),
      complete: vi.fn(async () => ({
        returnTo: "/dashboard",
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
    vi.mocked(getGoogleOAuthApplication).mockReturnValue(application);

    const response = await GET(
      new Request(
        `https://app.studiocar.test/api/auth/google/callback?code=code&state=${state}`,
        { headers: { cookie: `studiocar_google_oauth=${state}` } },
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://app.studiocar.test/dashboard",
    );
  });
});
