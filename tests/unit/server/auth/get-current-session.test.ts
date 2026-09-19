import { afterEach, describe, expect, it, vi } from "vitest";

import { getSessionService } from "../../../../apps/web/src/server/auth/session-runtime";
import {
  SessionService,
  type ActiveSession,
  type SessionStore,
} from "../../../../apps/web/src/server/auth/session-service";
import { getCurrentSession } from "../../../../apps/web/src/server/auth/get-current-session";

const SESSION_TOKEN = "s".repeat(43);
const cookieState = vi.hoisted(() => ({
  requestedName: "",
  token: "",
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      cookieState.requestedName = name;
      return cookieState.token ? { value: cookieState.token } : undefined;
    },
  })),
}));

vi.mock("../../../../apps/web/src/server/auth/session-runtime", () => ({
  getSessionService: vi.fn(),
}));

function sessionStore(): SessionStore {
  return {
    create: vi.fn(),
    findActiveByTokenHash: vi.fn(),
    rotate: vi.fn(),
    revokeByTokenHash: vi.fn(),
    revokeAllForUser: vi.fn(),
  };
}

describe("getCurrentSession", () => {
  afterEach(() => {
    cookieState.requestedName = "";
    cookieState.token = "";
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("avoids database work when the request has no session cookie", async () => {
    vi.stubEnv("NODE_ENV", "test");

    await expect(getCurrentSession()).resolves.toBeNull();

    expect(cookieState.requestedName).toBe("studiocar_session");
    expect(getSessionService).not.toHaveBeenCalled();
  });

  it("authenticates the opaque token from the production cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    cookieState.token = SESSION_TOKEN;
    const service = new SessionService(sessionStore());
    const activeSession: ActiveSession = {
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
    vi.spyOn(service, "authenticate").mockResolvedValue(activeSession);
    vi.mocked(getSessionService).mockReturnValue(service);

    await expect(getCurrentSession()).resolves.toEqual(activeSession);

    expect(cookieState.requestedName).toBe("__Host-studiocar_session");
    expect(service.authenticate).toHaveBeenCalledWith(SESSION_TOKEN);
  });
});
