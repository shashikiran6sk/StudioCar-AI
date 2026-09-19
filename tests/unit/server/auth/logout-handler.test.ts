import { describe, expect, it, vi } from "vitest";

import { handleLogout } from "../../../../apps/web/src/server/auth/logout-handler";
import {
  SessionService,
  type SessionStore,
} from "../../../../apps/web/src/server/auth/session-service";

const ENDPOINT = "https://app.studiocar.test/api/auth/logout";
const SESSION_TOKEN = "s".repeat(43);

function sessionService(): SessionService {
  const store: SessionStore = {
    create: vi.fn(),
    findActiveByTokenHash: vi.fn(),
    rotate: vi.fn(),
    revokeByTokenHash: vi.fn(async () => true),
    revokeAllForUser: vi.fn(),
  };
  return new SessionService(store);
}

function logoutRequest(origin = "https://app.studiocar.test"): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      cookie: `studiocar_session=${SESSION_TOKEN}`,
      origin,
    },
  });
}

describe("handleLogout", () => {
  it("revokes the current session, clears its cookie, and redirects", async () => {
    const sessions = sessionService();
    const logout = vi.spyOn(sessions, "logout");

    const response = await handleLogout(logoutRequest(), sessions, false);

    expect(logout).toHaveBeenCalledWith(SESSION_TOKEN);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://app.studiocar.test/login",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "studiocar_session=",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("rejects cross-origin logout before revoking a session", async () => {
    const sessions = sessionService();
    const logout = vi.spyOn(sessions, "logout");

    const response = await handleLogout(
      logoutRequest("https://attacker.test"),
      sessions,
      false,
      () => "request-1",
    );

    expect(response.status).toBe(403);
    expect(logout).not.toHaveBeenCalled();
  });
});
