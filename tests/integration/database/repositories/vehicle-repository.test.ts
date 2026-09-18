import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { VehicleListQuerySchema } from "../../../../packages/contracts/src/vehicle";
import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaVehicleRepository } from "../../../../packages/database/src/repositories/vehicle-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaVehicleRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaVehicleRepository;
  const ownerEmail = "vehicle-owner@integration.studiocar.test";
  const otherEmail = "vehicle-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaVehicleRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("enforces ownership on reads, updates, and cursor access", async () => {
    const [owner, otherUser] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const vehicle = await repository.createOwned(owner.id, {
      name: "Porsche 911 Carrera",
      stockId: "SC-001",
      year: 2026,
    });

    await expect(repository.findOwnedById(otherUser.id, vehicle.id)).resolves.toBeNull();
    await expect(
      repository.updateOwned(otherUser.id, vehicle.id, { name: "Stolen update" }),
    ).resolves.toBeNull();
    await expect(
      repository.listOwned(
        otherUser.id,
        VehicleListQuerySchema.parse({ cursor: vehicle.id }),
      ),
    ).resolves.toEqual({ items: [], nextCursor: null });

    await expect(repository.findOwnedById(owner.id, vehicle.id)).resolves.toMatchObject({
      name: "Porsche 911 Carrera",
    });
  });

  it("returns deterministic bounded pages and searchable results", async () => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });

    await Promise.all([
      repository.createOwned(owner.id, { name: "Alpha Audi", brand: "Audi" }),
      repository.createOwned(owner.id, { name: "Bravo BMW", brand: "BMW" }),
      repository.createOwned(owner.id, { name: "Charlie Citroen", brand: "Citroen" }),
    ]);

    const firstPage = await repository.listOwned(
      owner.id,
      VehicleListQuerySchema.parse({ limit: 2, sort: "NAME_ASC" }),
    );
    expect(firstPage.items.map(({ name }) => name)).toEqual([
      "Alpha Audi",
      "Bravo BMW",
    ]);
    expect(firstPage.nextCursor).toBe(firstPage.items[1]?.id);

    const secondPage = await repository.listOwned(
      owner.id,
      VehicleListQuerySchema.parse({
        cursor: firstPage.nextCursor,
        limit: 2,
        sort: "NAME_ASC",
      }),
    );
    expect(secondPage.items.map(({ name }) => name)).toEqual(["Charlie Citroen"]);
    expect(secondPage.nextCursor).toBeNull();

    const search = await repository.listOwned(
      owner.id,
      VehicleListQuerySchema.parse({ query: "bmw" }),
    );
    expect(search.items).toHaveLength(1);
    expect(search.items[0]?.brand).toBe("BMW");
  });
});
