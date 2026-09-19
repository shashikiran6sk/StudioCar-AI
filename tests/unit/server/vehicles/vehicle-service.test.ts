import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../../../../packages/contracts/src/vehicle";

import { VehicleService } from "../../../../apps/web/src/server/vehicles/vehicle-service";
import type { VehicleRepositoryPort } from "../../../../apps/web/src/server/vehicles/vehicle.types";

const vehicle = {
  id: "0e879f46-1193-4d77-b785-057fe026d998",
  name: "Porsche 911 Carrera",
  brand: null,
  model: null,
  variant: null,
  year: null,
  stockId: null,
  internalId: null,
  notes: null,
  status: "DRAFT",
  createdAt: "2026-09-19T12:00:00.000Z",
  updatedAt: "2026-09-19T12:00:00.000Z",
} satisfies Vehicle;

describe("VehicleService", () => {
  it("returns created drafts and harmless exact replays", async () => {
    const repository: VehicleRepositoryPort = {
      reserveDraftOwned: vi
        .fn()
        .mockResolvedValueOnce({ kind: "CREATED", vehicle })
        .mockResolvedValueOnce({ kind: "EXISTING", vehicle }),
      updateDraftOwned: vi.fn(),
    };
    const service = new VehicleService(repository);
    const command = { name: vehicle.name };

    await expect(
      service.create("user-1", "vehicle-request-0001", command),
    ).resolves.toMatchObject({ ok: true, response: { replayed: false } });
    await expect(
      service.create("user-1", "vehicle-request-0001", command),
    ).resolves.toMatchObject({ ok: true, response: { replayed: true } });
  });

  it("rejects reused keys with different commands and duplicate references", async () => {
    const repository: VehicleRepositoryPort = {
      reserveDraftOwned: vi
        .fn()
        .mockResolvedValueOnce({ kind: "EXISTING", vehicle })
        .mockResolvedValueOnce({ kind: "CONFLICT" }),
      updateDraftOwned: vi.fn(),
    };
    const service = new VehicleService(repository);

    await expect(
      service.create("user-1", "vehicle-request-0001", { name: "Different" }),
    ).resolves.toEqual({ ok: false, reason: "IDEMPOTENCY_CONFLICT" });
    await expect(
      service.create("user-1", "vehicle-request-0002", { name: "Duplicate" }),
    ).resolves.toEqual({ ok: false, reason: "REFERENCE_CONFLICT" });
  });

  it("maps owned draft update outcomes without leaking repository semantics", async () => {
    const repository: VehicleRepositoryPort = {
      reserveDraftOwned: vi.fn(),
      updateDraftOwned: vi
        .fn()
        .mockResolvedValueOnce({ kind: "UPDATED", vehicle })
        .mockResolvedValueOnce({ kind: "NOT_FOUND" })
        .mockResolvedValueOnce({ kind: "CONFLICT" }),
    };
    const service = new VehicleService(repository);

    await expect(
      service.update("user-1", vehicle.id, { name: vehicle.name }),
    ).resolves.toMatchObject({ ok: true, response: { vehicle } });
    await expect(
      service.update("user-1", vehicle.id, { name: vehicle.name }),
    ).resolves.toEqual({ ok: false, reason: "NOT_FOUND" });
    await expect(
      service.update("user-1", vehicle.id, { name: vehicle.name }),
    ).resolves.toEqual({ ok: false, reason: "REFERENCE_CONFLICT" });
  });
});
