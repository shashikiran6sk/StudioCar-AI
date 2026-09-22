import { afterEach, describe, expect, it, vi } from "vitest";

const isCurrentUserAdministrator = vi.fn();

vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator }),
);

const { assertAdministrator } = await import(
  "../../../../apps/web/src/server/admin/assert-administrator"
);

afterEach(() => {
  isCurrentUserAdministrator.mockReset();
});

describe("assertAdministrator", () => {
  it("permits an administrator", async () => {
    isCurrentUserAdministrator.mockResolvedValue(true);

    await expect(assertAdministrator("request-1")).resolves.toBeNull();
  });

  it("refuses everybody else", async () => {
    isCurrentUserAdministrator.mockResolvedValue(false);

    const response = await assertAdministrator("request-2");
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: { code: "FORBIDDEN", requestId: "request-2" },
    });
  });
});
