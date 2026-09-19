import { describe, expect, it, vi } from "vitest";

import { PATCH } from "../../../../../apps/web/src/app/api/profile/route";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { getProfileService } from "../../../../../apps/web/src/server/profile/profile-runtime";
import { ProfileService } from "../../../../../apps/web/src/server/profile/profile-service";
import type { ProfileRepositoryPort } from "../../../../../apps/web/src/server/profile/profile.types";
import { handleUpdateProfile } from "../../../../../apps/web/src/server/profile/update-profile-handler";

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../apps/web/src/server/profile/profile-runtime", () => ({
  getProfileService: vi.fn(),
}));

vi.mock("../../../../../apps/web/src/server/profile/update-profile-handler", () => ({
  handleUpdateProfile: vi.fn(async () => new Response(null, { status: 204 })),
}));

describe("PATCH /api/profile", () => {
  it("delegates session authentication and profile behavior", async () => {
    const session = {
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
    const repository: ProfileRepositoryPort = {
      findByUserId: vi.fn(),
      updateDisplayName: vi.fn(),
    };
    const profiles = new ProfileService(repository);
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getProfileService).mockReturnValue(profiles);
    const request = new Request("https://app.studiocar.test/api/profile", {
      method: "PATCH",
    });

    const response = await PATCH(request);

    expect(response.status).toBe(204);
    expect(handleUpdateProfile).toHaveBeenCalledWith(
      request,
      session,
      profiles,
    );
  });
});
