import { describe, expect, it, vi } from "vitest";

import { ProfileService } from "../../../../apps/web/src/server/profile/profile-service";
import type { ProfileRepositoryPort } from "../../../../apps/web/src/server/profile/profile.types";

function profileRepository(): ProfileRepositoryPort {
  return {
    findByUserId: vi.fn(),
    updateDisplayName: vi.fn(),
  };
}

describe("ProfileService", () => {
  it("reads the authenticated user's profile at the current time", async () => {
    const now = new Date("2026-09-19T12:00:00.000Z");
    const profiles = profileRepository();
    vi.mocked(profiles.findByUserId).mockResolvedValue(null);
    const service = new ProfileService(profiles, { now: () => now });

    await expect(service.get("user-1")).resolves.toBeNull();

    expect(profiles.findByUserId).toHaveBeenCalledWith("user-1", now);
  });

  it("updates only the requested user's display name", async () => {
    const profiles = profileRepository();
    vi.mocked(profiles.updateDisplayName).mockResolvedValue({
      id: "user-1",
      displayName: "Priya Anand",
      primaryEmail: "priya@example.com",
      primaryPhone: null,
    });
    const service = new ProfileService(profiles);

    await expect(
      service.update("user-1", { displayName: "Priya Anand" }),
    ).resolves.toMatchObject({ displayName: "Priya Anand" });
    expect(profiles.updateDisplayName).toHaveBeenCalledWith(
      "user-1",
      "Priya Anand",
    );
  });
});
