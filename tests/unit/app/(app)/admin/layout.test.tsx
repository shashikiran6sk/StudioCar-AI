import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();

vi.mock(
  "../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);

const { default: AdminLayout, metadata } = await import(
  "../../../../../apps/web/src/app/(app)/admin/layout"
);

describe("AdminLayout", () => {
  it("keeps administrator pages out of search indexes", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
  it("authorizes before rendering anything", async () => {
    requireAdministrator.mockResolvedValue({ userId: "user-1" });

    await AdminLayout({ children: <p>Admin content</p> });

    expect(requireAdministrator).toHaveBeenCalled();
  });

  it("does not render when authorization refuses", async () => {
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(
      AdminLayout({ children: <p>Admin content</p> }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
