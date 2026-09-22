import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const listAdministrators = vi.fn();
const listPendingInvites = vi.fn();

vi.mock(
  "../../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock("../../../../../../apps/web/src/server/admin/admin-runtime", () => ({
  getAdminRoleRepository: () => ({ listAdministrators }),
}));
vi.mock(
  "../../../../../../apps/web/src/server/admin/admin-management-runtime",
  () => ({ getAdminManagementRepository: () => ({ listPendingInvites }) }),
);

const { default: AdministratorsPage } = await import(
  "../../../../../../apps/web/src/app/(app)/admin/admins/page"
);

describe("AdministratorsPage", () => {
  it("authorizes for itself before reading anything", async () => {
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));
    listAdministrators.mockClear();
    listPendingInvites.mockClear();

    await expect(AdministratorsPage()).rejects.toThrow("NOT_FOUND");
    expect(listAdministrators).not.toHaveBeenCalled();
    expect(listPendingInvites).not.toHaveBeenCalled();
  });
});
