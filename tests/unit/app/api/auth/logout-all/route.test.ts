import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/auth/logout-all/route";
import { handleLogoutEverywhere } from "../../../../../../apps/web/src/server/auth/logout-everywhere-handler";
import { getSessionService } from "../../../../../../apps/web/src/server/auth/session-runtime";
import {
  SessionService,
  type SessionStore,
} from "../../../../../../apps/web/src/server/auth/session-service";

vi.mock("../../../../../../apps/web/src/server/auth/logout-everywhere-handler", () => ({
  handleLogoutEverywhere: vi.fn(async () => new Response(null, { status: 204 })),
}));

vi.mock("../../../../../../apps/web/src/server/auth/session-runtime", () => ({
  getSessionService: vi.fn(),
}));

describe("POST /api/auth/logout-all", () => {
  it("delegates to the all-session logout handler", async () => {
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
      "https://app.studiocar.test/api/auth/logout-all",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(handleLogoutEverywhere).toHaveBeenCalledWith(
      request,
      sessions,
      false,
    );
  });
});
