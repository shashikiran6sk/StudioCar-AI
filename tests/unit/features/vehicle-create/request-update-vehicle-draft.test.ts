import { describe, expect, it, vi } from "vitest";

import { requestUpdateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-update-vehicle-draft";

describe("requestUpdateVehicleDraft", () => {
  it("updates the tenant-owned draft through its file-based endpoint", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        vehicle: {
          id: "0e879f46-1193-4d77-b785-057fe026d998",
          name: "Updated BMW",
          brand: "BMW",
          model: null,
          variant: null,
          year: null,
          stockId: null,
          internalId: null,
          notes: null,
          status: "DRAFT",
          createdAt: "2026-09-19T10:00:00.000Z",
          updatedAt: "2026-09-19T10:05:00.000Z",
        },
      }),
    );

    await expect(
      requestUpdateVehicleDraft(
        "0e879f46-1193-4d77-b785-057fe026d998",
        { name: "Updated BMW" },
        fetcher,
      ),
    ).resolves.toMatchObject({ vehicle: { name: "Updated BMW" } });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/vehicles/0e879f46-1193-4d77-b785-057fe026d998",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
