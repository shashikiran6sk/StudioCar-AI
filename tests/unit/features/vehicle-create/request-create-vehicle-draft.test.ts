import { describe, expect, it, vi } from "vitest";

import { requestCreateVehicleDraft } from "../../../../apps/web/src/features/vehicle-create/request-create-vehicle-draft";

describe("requestCreateVehicleDraft", () => {
  it("sends an idempotent request and validates the draft", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({
        replayed: false,
        vehicle: {
          id: "0e879f46-1193-4d77-b785-057fe026d998",
          name: "2022 BMW 3 Series",
          brand: "BMW",
          model: "3 Series",
          variant: null,
          year: 2022,
          stockId: "NL-3429",
          internalId: null,
          notes: null,
          status: "DRAFT",
          createdAt: "2026-09-19T10:00:00.000Z",
          updatedAt: "2026-09-19T10:00:00.000Z",
        },
      }),
    );

    await expect(
      requestCreateVehicleDraft(
        { name: "2022 BMW 3 Series" },
        "draft-request-1",
        fetcher,
      ),
    ).resolves.toMatchObject({ replayed: false });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/vehicles",
      expect.objectContaining({
        headers: expect.objectContaining({
          "idempotency-key": "draft-request-1",
        }),
        method: "POST",
      }),
    );
  });

  it("surfaces a validated server error", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            code: "CONFLICT",
            message: "Stock reference already exists.",
            requestId: "request-1",
          },
        },
        { status: 409 },
      ),
    );

    await expect(
      requestCreateVehicleDraft(
        { name: "2022 BMW 3 Series" },
        "draft-request-1",
        fetcher,
      ),
    ).rejects.toThrow("Stock reference already exists.");
  });
});
