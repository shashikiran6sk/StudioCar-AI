import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/auth/logout/route";
import { handleLogout } from "../../../../../../apps/web/src/server/auth/logout-handler";
import { getSessionService } from "../../../../../../apps/web/src/server/auth/session-runtime";
import {
  SessionService,
  type SessionStore,
} from "../../../../../../apps/web/src/server/auth/session-service";

vi.mock("../../../../../../apps/web/src/server/auth/logout-handler", () => ({
  handleLogout: vi.fn(async () => new Response(null, { status: 204 })),
}));

vi.mock("../../../../../../apps/web/src/server/auth/session-runtime", () => ({
  getSessionService: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
  it("delegates the request to the logout application handler", async () => {
    const store: SessionStore = {
      create: vi.fn(),
      findActiveByTokenHash: vi.fn(),
      rotate: vi.fn(),
      revokeByTokenHash: vi.fn(),
      revokeAllForUser: vi.fn(),
    };
    const sessions = new SessionService(store);
    vi.mocked(getSessionService).mockReturnValue(sessions);
    const request = new Request(
      "https://app.studiocar.test/api/auth/logout",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(handleLogout).toHaveBeenCalledWith(request, sessions, false);
  });
});
