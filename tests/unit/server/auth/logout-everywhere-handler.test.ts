import { describe, expect, it, vi } from "vitest";

import { handleLogoutEverywhere } from "../../../../apps/web/src/server/auth/logout-everywhere-handler";
import {
  SessionService,
  type ActiveSession,
  type SessionStore,
} from "../../../../apps/web/src/server/auth/session-service";

const ENDPOINT = "https://app.studiocar.test/api/auth/logout-all";
const SESSION_TOKEN = "s".repeat(43);

function sessionService(): SessionService {
  const store: SessionStore = {
    create: vi.fn(),
    findActiveByTokenHash: vi.fn(),
    rotate: vi.fn(),
    revokeByTokenHash: vi.fn(),
    revokeAllForUser: vi.fn(),
  };
  return new SessionService(store);
}

function session(): ActiveSession {
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

function request(origin = "https://app.studiocar.test") {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      cookie: `studiocar_session=${SESSION_TOKEN}`,
      origin,
    },
  });
}

describe("handleLogoutEverywhere", () => {
  it("authenticates the current token and revokes every user session", async () => {
    const sessions = sessionService();
    vi.spyOn(sessions, "authenticate").mockResolvedValue(session());
    const logoutEverywhere = vi
      .spyOn(sessions, "logoutEverywhere")
      .mockResolvedValue(3);

    const response = await handleLogoutEverywhere(request(), sessions, false);

    expect(logoutEverywhere).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://app.studiocar.test/login",
    );
    expect(response.headers.get("set-cookie")).toContain("studiocar_session=");
  });

  it("rejects cross-origin requests before session work", async () => {
    const sessions = sessionService();
    const authenticate = vi.spyOn(sessions, "authenticate");

    const response = await handleLogoutEverywhere(
      request("https://attacker.test"),
      sessions,
      false,
      () => "request-1",
    );

    expect(response.status).toBe(403);
    expect(authenticate).not.toHaveBeenCalled();
  });
});
