import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isCurrentUserAdministrator = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("REDIRECT");
});
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound, redirect }));
vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);

const { requireAdministrator } = await import(
  "../../../../apps/web/src/server/admin/require-administrator"
);

afterEach(() => {
  getCurrentSession.mockReset();
  isCurrentUserAdministrator.mockReset();
  redirect.mockClear();
  notFound.mockClear();
});

describe("requireAdministrator", () => {
  it("returns the session for an administrator", async () => {
    const session = { userId: "user-1" };
    getCurrentSession.mockResolvedValue(session);
    isCurrentUserAdministrator.mockResolvedValue(true);

    await expect(requireAdministrator()).resolves.toBe(session);
  });

  it("sends an unauthenticated visitor to sign in", async () => {
    getCurrentSession.mockResolvedValue(null);

    await expect(requireAdministrator()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("does not disclose the area to a signed-in non-administrator", async () => {
    getCurrentSession.mockResolvedValue({ userId: "user-2" });
    isCurrentUserAdministrator.mockResolvedValue(false);

    await expect(requireAdministrator()).rejects.toThrow("NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
