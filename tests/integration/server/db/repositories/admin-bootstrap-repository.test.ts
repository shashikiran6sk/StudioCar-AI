import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAdminBootstrapRepository } from "../../../../../apps/web/src/server/db/repositories/admin-bootstrap-repository";
import { PrismaAdminRoleRepository } from "../../../../../apps/web/src/server/db/repositories/admin-role-repository";
import { AdminBootstrapService } from "../../../../../apps/web/src/server/admin/admin-bootstrap-service";
import { ADMIN_BOOTSTRAP_CONFIG_KEY } from "../../../../../apps/web/src/server/admin/admin.constants";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "bootstrap-owner@integration.studiocar.test";
const otherEmail = "bootstrap-other@integration.studiocar.test";
const now = new Date("2026-09-22T10:00:00.000Z");

databaseDescribe("first administrator bootstrap", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let bootstrap: PrismaAdminBootstrapRepository;
  let roles: PrismaAdminRoleRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    bootstrap = new PrismaAdminBootstrapRepository(database);
    roles = new PrismaAdminRoleRepository(database);
  });

  afterEach(async () => {
    await database.auditLog.deleteMany({
      where: { resourceType: "UserRole" },
    });
    await database.appConfig.deleteMany({
      where: { key: ADMIN_BOOTSTRAP_CONFIG_KEY },
    });
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createUser(email: string) {
    return database.user.create({ data: { primaryEmail: email } });
  }

  it("grants the first administrator and records that it happened", async () => {
    const owner = await createUser(ownerEmail);

    await expect(bootstrap.bootstrap(owner.id, now)).resolves.toEqual({
      kind: "BOOTSTRAPPED",
    });
    await expect(roles.isAdministrator(owner.id)).resolves.toBe(true);
    await expect(bootstrap.isCompleted()).resolves.toBe(true);

    const audit = await database.auditLog.findFirstOrThrow({
      where: { resourceId: owner.id },
      select: { action: true, userId: true },
    });
    // The actor is the system: no administrator existed to perform this.
    expect(audit).toEqual({
      action: "INITIAL_ADMIN_BOOTSTRAPPED",
      userId: null,
    });
  });

  it("is idempotent, so repeated sign-ins grant nothing further", async () => {
    const owner = await createUser(ownerEmail);
    await bootstrap.bootstrap(owner.id, now);

    await expect(bootstrap.bootstrap(owner.id, now)).resolves.toEqual({
      kind: "ALREADY_COMPLETED",
    });
    expect(await database.userRole.count({ where: { userId: owner.id } })).toBe(
      1,
    );
  });

  it("grants nobody else once bootstrap has completed", async () => {
    const [owner, other] = await Promise.all([
      createUser(ownerEmail),
      createUser(otherEmail),
    ]);
    await bootstrap.bootstrap(owner.id, now);

    await expect(bootstrap.bootstrap(other.id, now)).resolves.toEqual({
      kind: "ALREADY_COMPLETED",
    });
    await expect(roles.isAdministrator(other.id)).resolves.toBe(false);
  });

  it("does not re-grant a revoked administrator", async () => {
    const owner = await createUser(ownerEmail);
    await bootstrap.bootstrap(owner.id, now);

    // Another administrator revokes the original bootstrap administrator.
    await database.userRole.deleteMany({ where: { userId: owner.id } });

    // They sign in again with the environment variable still naming them.
    await expect(bootstrap.bootstrap(owner.id, now)).resolves.toEqual({
      kind: "ALREADY_COMPLETED",
    });
    await expect(roles.isAdministrator(owner.id)).resolves.toBe(false);
  });

  it("creates exactly one administrator when two sign-ins race", async () => {
    const [owner, other] = await Promise.all([
      createUser(ownerEmail),
      createUser(otherEmail),
    ]);

    const outcomes = await Promise.all([
      bootstrap.bootstrap(owner.id, now),
      bootstrap.bootstrap(other.id, now),
    ]);

    expect(
      outcomes.filter((outcome) => outcome.kind === "BOOTSTRAPPED"),
    ).toHaveLength(1);
    await expect(roles.countAdministrators()).resolves.toBe(1);
  });

  it("grants only the configured verified email through the service", async () => {
    const [owner, other] = await Promise.all([
      createUser(ownerEmail),
      createUser(otherEmail),
    ]);
    const service = new AdminBootstrapService(bootstrap, {
      bootstrapEmail: ownerEmail,
    });

    await expect(
      service.evaluate(other.id, otherEmail, now),
    ).resolves.toBeNull();
    await expect(roles.isAdministrator(other.id)).resolves.toBe(false);

    await expect(service.evaluate(owner.id, ownerEmail, now)).resolves.toEqual({
      kind: "BOOTSTRAPPED",
    });
    await expect(roles.isAdministrator(owner.id)).resolves.toBe(true);
  });

  it("keeps an administrator after the environment value is removed", async () => {
    const owner = await createUser(ownerEmail);
    await new AdminBootstrapService(bootstrap, {
      bootstrapEmail: ownerEmail,
    }).evaluate(owner.id, ownerEmail, now);

    // The deployment removes BOOTSTRAP_ADMIN_EMAIL entirely.
    const withoutConfiguration = new AdminBootstrapService(bootstrap, {
      bootstrapEmail: undefined,
    });
    await expect(
      withoutConfiguration.evaluate(owner.id, ownerEmail, now),
    ).resolves.toBeNull();

    // Authorization is a row, so removing the value revokes nothing.
    await expect(roles.isAdministrator(owner.id)).resolves.toBe(true);
  });

  it("transfers nothing when the environment value later names somebody else", async () => {
    const [owner, other] = await Promise.all([
      createUser(ownerEmail),
      createUser(otherEmail),
    ]);
    await new AdminBootstrapService(bootstrap, {
      bootstrapEmail: ownerEmail,
    }).evaluate(owner.id, ownerEmail, now);

    await new AdminBootstrapService(bootstrap, {
      bootstrapEmail: otherEmail,
    }).evaluate(other.id, otherEmail, now);

    await expect(roles.isAdministrator(owner.id)).resolves.toBe(true);
    await expect(roles.isAdministrator(other.id)).resolves.toBe(false);
  });
});
