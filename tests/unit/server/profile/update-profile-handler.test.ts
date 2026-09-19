import { describe, expect, it, vi } from "vitest";

import { handleUpdateProfile } from "../../../../apps/web/src/server/profile/update-profile-handler";
import type { ProfileApplication } from "../../../../apps/web/src/server/profile/profile.types";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";

const ENDPOINT = "https://app.studiocar.test/api/profile";

function application(): ProfileApplication {
  return {
    get: vi.fn(),
    update: vi.fn(async () => ({
      id: "user-1",
      displayName: "Priya Anand",
      primaryEmail: "priya@example.com",
      primaryPhone: null,
    })),
  };
}

function activeSession(): ActiveSession {
  return {
    id: "session-1",
    userId: "user-1",
    expiresAt: new Date("2026-10-19T00:00:00.000Z"),
    user: {
      id: "user-1",
      displayName: "Priya Sharma",
      primaryEmail: "priya@example.com",
      primaryPhone: null,
    },
  };
}

function request(body: unknown, origin = "https://app.studiocar.test") {
  return new Request(ENDPOINT, {
    method: "PATCH",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("handleUpdateProfile", () => {
  it("validates and updates only the authenticated user", async () => {
    const profiles = application();

    const response = await handleUpdateProfile(
      request({ displayName: "  Priya Anand  " }),
      activeSession(),
      profiles,
    );

    expect(response.status).toBe(200);
    expect(profiles.update).toHaveBeenCalledWith("user-1", {
      displayName: "Priya Anand",
    });
  });

  it("rejects unauthenticated, cross-origin, and invalid requests", async () => {
    const profiles = application();
    const unauthenticated = await handleUpdateProfile(
      request({ displayName: "Priya Anand" }),
      null,
      profiles,
      () => "request-1",
    );
    const crossOrigin = await handleUpdateProfile(
      request({ displayName: "Priya Anand" }, "https://attacker.test"),
      activeSession(),
      profiles,
      () => "request-2",
    );
    const invalid = await handleUpdateProfile(
      request({ displayName: "P" }),
      activeSession(),
      profiles,
      () => "request-3",
    );

    expect(unauthenticated.status).toBe(401);
    expect(crossOrigin.status).toBe(403);
    expect(invalid.status).toBe(400);
    expect(profiles.update).not.toHaveBeenCalled();
  });
});
