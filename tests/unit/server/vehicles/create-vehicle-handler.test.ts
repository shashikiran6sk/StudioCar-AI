import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../../../../packages/contracts/src/vehicle";

import { handleCreateVehicle } from "../../../../apps/web/src/server/vehicles/create-vehicle-handler";
import type { ActiveSession } from "../../../../apps/web/src/server/auth/session-service";
import type { VehicleApplication } from "../../../../apps/web/src/server/vehicles/vehicle.types";

const endpoint = "https://app.studiocar.test/api/vehicles";
const vehicle = {
  id: "0e879f46-1193-4d77-b785-057fe026d998",
  name: "Porsche 911 Carrera",
  brand: "Porsche",
  model: "911",
  variant: null,
  year: 2026,
  stockId: null,
  internalId: null,
  notes: null,
  status: "DRAFT",
  createdAt: "2026-09-19T12:00:00.000Z",
  updatedAt: "2026-09-19T12:00:00.000Z",
} satisfies Vehicle;

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

function createRequest(
  body: unknown,
  idempotencyKey = "vehicle-request-0001",
  origin = "https://app.studiocar.test",
): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      origin,
    },
    body: JSON.stringify(body),
  });
}

describe("handleCreateVehicle", () => {
  it("creates an owned draft and identifies exact replays", async () => {
    const vehicles: VehicleApplication = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          response: { vehicle, replayed: false },
        })
        .mockResolvedValueOnce({
          ok: true,
          response: { vehicle, replayed: true },
        }),
      update: vi.fn(),
    };
    const request = createRequest({
      name: " Porsche 911 Carrera ",
      brand: "Porsche",
      model: "911",
      year: "2026",
    });

    const created = await handleCreateVehicle(request, session, vehicles);
    const replay = await handleCreateVehicle(
      createRequest({ name: vehicle.name }),
      session,
      vehicles,
    );

    expect(created.status).toBe(201);
    expect(created.headers.get("cache-control")).toBe("private, no-store");
    expect(replay.status).toBe(200);
    expect(vehicles.create).toHaveBeenNthCalledWith(
      1,
      session.userId,
      "vehicle-request-0001",
      {
        name: vehicle.name,
        brand: "Porsche",
        model: "911",
        year: 2026,
      },
    );
  });

  it("rejects cross-origin, unauthenticated, and invalid input before calling the service", async () => {
    const vehicles: VehicleApplication = {
      create: vi.fn(),
      update: vi.fn(),
    };
    const crossOrigin = await handleCreateVehicle(
      createRequest(
        { name: vehicle.name },
        "vehicle-request-0001",
        "https://attacker.test",
      ),
      session,
      vehicles,
      () => "request-0001",
    );
    const unauthenticated = await handleCreateVehicle(
      createRequest({ name: vehicle.name }),
      null,
      vehicles,
      () => "request-0002",
    );
    const invalid = await handleCreateVehicle(
      createRequest({ name: "" }, "short"),
      session,
      vehicles,
      () => "request-0003",
    );

    expect(crossOrigin.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(400);
    expect(vehicles.create).not.toHaveBeenCalled();
  });

  it("returns deterministic conflicts and unavailable responses", async () => {
    const vehicles: VehicleApplication = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          reason: "IDEMPOTENCY_CONFLICT",
        })
        .mockResolvedValueOnce({
          ok: false,
          reason: "REFERENCE_CONFLICT",
        })
        .mockRejectedValueOnce(new Error("database unavailable")),
      update: vi.fn(),
    };

    const idempotencyConflict = await handleCreateVehicle(
      createRequest({ name: vehicle.name }),
      session,
      vehicles,
    );
    const referenceConflict = await handleCreateVehicle(
      createRequest({ name: vehicle.name }, "vehicle-request-0002"),
      session,
      vehicles,
    );
    const unavailable = await handleCreateVehicle(
      createRequest({ name: vehicle.name }, "vehicle-request-0003"),
      session,
      vehicles,
    );

    expect(idempotencyConflict.status).toBe(409);
    expect(referenceConflict.status).toBe(409);
    expect(unavailable.status).toBe(503);
  });
});
