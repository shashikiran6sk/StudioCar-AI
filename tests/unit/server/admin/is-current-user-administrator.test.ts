import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const isAdministrator = vi.fn();

vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock("../../../../apps/web/src/server/admin/admin-runtime", () => ({
  getAdminRoleRepository: () => ({ isAdministrator }),
}));

const { isCurrentUserAdministrator } = await import(
  "../../../../apps/web/src/server/admin/is-current-user-administrator"
);

afterEach(() => {
  getCurrentSession.mockReset();
  isAdministrator.mockReset();
});

describe("isCurrentUserAdministrator", () => {
  it("asks the database for the signed-in account", async () => {
    getCurrentSession.mockResolvedValue({ userId: "user-1" });
    isAdministrator.mockResolvedValue(true);

    await expect(isCurrentUserAdministrator()).resolves.toBe(true);
    expect(isAdministrator).toHaveBeenCalledWith("user-1");
  });

  it("is false without a session, without asking the database", async () => {
    getCurrentSession.mockResolvedValue(null);

    await expect(isCurrentUserAdministrator()).resolves.toBe(false);
    expect(isAdministrator).not.toHaveBeenCalled();
  });

  it("is false when the account holds no administrator role", async () => {
    getCurrentSession.mockResolvedValue({ userId: "user-2" });
    isAdministrator.mockResolvedValue(false);

    await expect(isCurrentUserAdministrator()).resolves.toBe(false);
  });
});
