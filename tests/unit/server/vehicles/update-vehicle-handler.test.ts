import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../../../../packages/contracts/src/vehicle";

import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import { handleUpdateVehicle } from "../../../../apps/web/src/server/vehicles/update-vehicle-handler";
import type { VehicleApplication } from "../../../../apps/web/src/server/vehicles/vehicle.types";

const vehicleId = "0e879f46-1193-4d77-b785-057fe026d998";
const endpoint = `https://app.studiocar.test/api/vehicles/${vehicleId}`;
const session: ActiveSession = {
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
const vehicle = {
  id: vehicleId,
  name: "Updated vehicle",
  brand: null,
  model: null,
  variant: null,
  year: null,
  stockId: null,
  internalId: null,
  notes: null,
  status: "DRAFT",
  createdAt: "2026-09-19T12:00:00.000Z",
  updatedAt: "2026-09-19T12:05:00.000Z",
} satisfies Vehicle;

function updateRequest(body: unknown): Request {
  return new Request(endpoint, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "https://app.studiocar.test",
    },
    body: JSON.stringify(body),
  });
}

describe("handleUpdateVehicle", () => {
  it("validates and updates only an authenticated owned draft", async () => {
    const vehicles: VehicleApplication = {
      create: vi.fn(),
      update: vi.fn<VehicleApplication["update"]>(async () => ({
        ok: true,
        response: { vehicle },
      })),
    };

    const response = await handleUpdateVehicle(
      updateRequest({ name: " Updated vehicle " }),
      { vehicleId },
      session,
      vehicles,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(vehicles.update).toHaveBeenCalledWith(session.userId, vehicleId, {
      name: vehicle.name,
    });
  });

  it("rejects missing ownership, conflicting references, and invalid paths", async () => {
    const vehicles: VehicleApplication = {
      create: vi.fn(),
      update: vi
        .fn()
        .mockResolvedValueOnce({ ok: false, reason: "NOT_FOUND" })
        .mockResolvedValueOnce({ ok: false, reason: "REFERENCE_CONFLICT" }),
    };
    const missing = await handleUpdateVehicle(
      updateRequest({ name: vehicle.name }),
      { vehicleId },
      session,
      vehicles,
    );
    const conflict = await handleUpdateVehicle(
      updateRequest({ stockId: "SC-001" }),
      { vehicleId },
      session,
      vehicles,
    );
    const invalid = await handleUpdateVehicle(
      updateRequest({}),
      { vehicleId: "not-a-uuid" },
      session,
      vehicles,
      () => "request-0001",
    );

    expect(missing.status).toBe(404);
    expect(conflict.status).toBe(409);
    expect(invalid.status).toBe(400);
  });
});
