import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAdminRoleRepository } from "../../../../../apps/web/src/server/db/repositories/admin-role-repository";
import { PrismaAdminOverviewRepository } from "../../../../../apps/web/src/server/db/repositories/admin-overview-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const adminEmail = "role-admin@integration.studiocar.test";
const plainEmail = "role-plain@integration.studiocar.test";

databaseDescribe("PrismaAdminRoleRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let roles: PrismaAdminRoleRepository;
  let overview: PrismaAdminOverviewRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    roles = new PrismaAdminRoleRepository(database);
    overview = new PrismaAdminOverviewRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [adminEmail, plainEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("reports administrator status from the database alone", async () => {
    const [administrator, plain] = await Promise.all([
      database.user.create({ data: { primaryEmail: adminEmail } }),
      database.user.create({ data: { primaryEmail: plainEmail } }),
    ]);
    await database.userRole.create({
      data: {
        userId: administrator.id,
        role: "ADMIN",
        source: "ADMIN_GRANT",
      },
    });

    await expect(roles.isAdministrator(administrator.id)).resolves.toBe(true);
    await expect(roles.isAdministrator(plain.id)).resolves.toBe(false);
  });

  it("stops reporting a revoked administrator immediately", async () => {
    const administrator = await database.user.create({
      data: { primaryEmail: adminEmail },
    });
    await database.userRole.create({
      data: {
        userId: administrator.id,
        role: "ADMIN",
        source: "ADMIN_GRANT",
      },
    });

    await database.userRole.deleteMany({
      where: { userId: administrator.id },
    });

    await expect(roles.isAdministrator(administrator.id)).resolves.toBe(false);
  });

  it("refuses to hold the same role twice for one account", async () => {
    const administrator = await database.user.create({
      data: { primaryEmail: adminEmail },
    });
    const grant = {
      userId: administrator.id,
      role: "ADMIN" as const,
      source: "ADMIN_GRANT" as const,
    };
    await database.userRole.create({ data: grant });

    await expect(database.userRole.create({ data: grant })).rejects.toThrow();
  });

  it("lists administrators with who granted them", async () => {
    const [granter, granted] = await Promise.all([
      database.user.create({
        data: { primaryEmail: adminEmail, displayName: "Granting Admin" },
      }),
      database.user.create({ data: { primaryEmail: plainEmail } }),
    ]);
    await database.userRole.create({
      data: { userId: granter.id, role: "ADMIN", source: "BOOTSTRAP" },
    });
    await database.userRole.create({
      data: {
        userId: granted.id,
        role: "ADMIN",
        source: "ADMIN_GRANT",
        grantedByUserId: granter.id,
      },
    });

    const listed = await roles.listAdministrators();
    const entry = listed.find((row) => row.userId === granted.id);
    expect(entry).toMatchObject({
      source: "ADMIN_GRANT",
      grantedByUserId: granter.id,
      grantedByName: "Granting Admin",
    });
  });

  it("counts administrators for the overview", async () => {
    const before = await overview.summarise();
    const administrator = await database.user.create({
      data: { primaryEmail: adminEmail },
    });
    await database.userRole.create({
      data: {
        userId: administrator.id,
        role: "ADMIN",
        source: "ADMIN_GRANT",
      },
    });

    const after = await overview.summarise();
    expect(after.administratorCount).toBe(before.administratorCount + 1);
    expect(after.userCount).toBeGreaterThan(before.userCount);
  });
});
