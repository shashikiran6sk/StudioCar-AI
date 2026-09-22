import { describe, expect, it, vi } from "vitest";

import type { GoogleOAuthApplication } from "../../../../../../../apps/web/src/server/auth/google/google-auth.types";
import { getGoogleOAuthApplication } from "../../../../../../../apps/web/src/server/auth/google/google-auth-runtime";
import { GET } from "../../../../../../../apps/web/src/app/api/auth/google/start/route";

vi.mock("../../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(async () => null),
}));
vi.mock("../../../../../../../apps/web/src/server/auth/google/google-auth-runtime", () => ({
  getGoogleOAuthApplication: vi.fn(),
}));

describe("GET /api/auth/google/start", () => {
  it("delegates the endpoint to the Google authentication application", async () => {
    const application: GoogleOAuthApplication = {
      start: vi.fn(async () => ({
        authorizationUrl: new URL("https://accounts.google.com/o/oauth2/v2/auth"),
        state: "s".repeat(43),
        expiresAt: new Date("2026-09-18T12:10:00.000Z"),
      })),
      complete: vi.fn(),
    };
    vi.mocked(getGoogleOAuthApplication).mockReturnValue(application);

    const response = await GET(
      new Request("https://app.studiocar.test/api/auth/google/start"),
    );

    expect(response.status).toBe(302);
    expect(application.start).toHaveBeenCalledWith({ returnTo: "/dashboard" });
  });
});
