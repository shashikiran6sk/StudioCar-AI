import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../apps/web/src/app/api/vehicles/route";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { handleCreateVehicle } from "../../../../../apps/web/src/server/vehicles/create-vehicle-handler";
import { getVehicleService } from "../../../../../apps/web/src/server/vehicles/vehicle-runtime";
import { VehicleService } from "../../../../../apps/web/src/server/vehicles/vehicle-service";
import type { VehicleRepositoryPort } from "../../../../../apps/web/src/server/vehicles/vehicle.types";

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../apps/web/src/server/vehicles/vehicle-runtime", () => ({
  getVehicleService: vi.fn(),
}));
vi.mock(
  "../../../../../apps/web/src/server/vehicles/create-vehicle-handler",
  () => ({
    handleCreateVehicle: vi.fn(
      async () => new Response(null, { status: 201 }),
    ),
  }),
);

describe("POST /api/vehicles", () => {
  it("delegates authentication and vehicle creation behavior", async () => {
    const session = {
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-10-19T00:00:00.000Z"),
      user: {
        id: "user-1",
        displayName: null,
        primaryEmail: "owner@example.com",
        primaryPhone: null,
      },
    };
    const repository: VehicleRepositoryPort = {
      reserveDraftOwned: vi.fn(),
      updateDraftOwned: vi.fn(),
    };
    const vehicles = new VehicleService(repository);
    vi.mocked(getCurrentSession).mockResolvedValue(session);
    vi.mocked(getVehicleService).mockReturnValue(vehicles);
    const request = new Request("https://app.studiocar.test/api/vehicles", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(handleCreateVehicle).toHaveBeenCalledWith(
      request,
      session,
      vehicles,
    );
  });
});
