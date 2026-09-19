import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import ProfilePage from "../../../../../../apps/web/src/app/(app)/settings/profile/page";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";
import { getProfileService } from "../../../../../../apps/web/src/server/profile/profile-runtime";
import { ProfileService } from "../../../../../../apps/web/src/server/profile/profile-service";
import type { ProfileRepositoryPort } from "../../../../../../apps/web/src/server/profile/profile.types";
import { createTestRouter } from "../../../../features/profile/create-test-router";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  useRouter: vi.fn(),
}));

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../../../apps/web/src/server/profile/profile-runtime", () => ({
  getProfileService: vi.fn(),
}));

describe("ProfilePage", () => {
  it("renders profile, identity, and active-session controls", async () => {
    vi.mocked(useRouter).mockReturnValue(createTestRouter());
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-10-19T00:00:00.000Z"),
      user: {
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
    });
    const profile = {
      user: {
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
      identities: [
        {
          provider: "GOOGLE",
          email: "priya@example.com",
          phoneNumber: null,
          linkedAt: "2026-09-19T00:00:00.000Z",
          lastAuthenticatedAt: "2026-09-19T01:00:00.000Z",
        },
      ],
      activeSessionCount: 2,
    } satisfies Awaited<ReturnType<ProfileRepositoryPort["findByUserId"]>>;
    const repository: ProfileRepositoryPort = {
      findByUserId: vi.fn(async () => profile),
      updateDisplayName: vi.fn(),
    };
    vi.mocked(getProfileService).mockReturnValue(new ProfileService(repository));

    render(await ProfilePage());

    expect(
      screen.getByRole("heading", { name: "Profile & security" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("priya@example.com")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Log out all devices" }),
    ).toBeInTheDocument();
  });
});
