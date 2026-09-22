import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAuditLogRepository } from "../../../../../apps/web/src/server/db/repositories/audit-log-repository";
import { describeAuditEntry } from "../../../../../apps/web/src/server/admin/describe-audit-entry";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const actorEmail = "audit-actor@integration.studiocar.test";

databaseDescribe("PrismaAuditLogRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaAuditLogRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaAuditLogRepository(database);
  });

  afterEach(async () => {
    await database.auditLog.deleteMany({
      where: { resourceType: { in: ["UserRole", "PlanConfig", "Vehicle"] } },
    });
    await database.user.deleteMany({ where: { primaryEmail: actorEmail } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createActor() {
    return database.user.create({
      data: { primaryEmail: actorEmail, displayName: "Ops Lead" },
    });
  }

  it("returns administrative changes, newest first", async () => {
    const actor = await createActor();
    await database.auditLog.createMany({
      data: [
        {
          userId: actor.id,
          action: "ADMIN_GRANTED",
          resourceType: "UserRole",
          resourceId: actor.id,
          createdAt: new Date("2026-09-21T10:00:00.000Z"),
        },
        {
          userId: actor.id,
          action: "PLAN_CONFIG_UPDATED",
          resourceType: "PlanConfig",
          resourceId: "STUDIO_PRO",
          createdAt: new Date("2026-09-22T10:00:00.000Z"),
        },
      ],
    });

    /**
     * Scoped to this test's own actor. Other suites write to the same trail
     * concurrently, and asserting on absolute positions would make this pass
     * or fail on timing rather than on ordering.
     */
    const mine = (await repository.listRecentAdministrative(100)).filter(
      (entry) => entry.actorName === "Ops Lead",
    );
    expect(mine.map((entry) => entry.action)).toEqual([
      "PLAN_CONFIG_UPDATED",
      "ADMIN_GRANTED",
    ]);
  });

  it("omits entries that are not administrative changes", async () => {
    const actor = await createActor();
    await database.auditLog.create({
      data: {
        userId: actor.id,
        action: "VEHICLE_CREATED",
        resourceType: "Vehicle",
        resourceId: actor.id,
      },
    });

    // The trail also carries ordinary account activity, which is not this page.
    const entries = await repository.listRecentAdministrative(100);
    expect(entries.map((entry) => entry.action)).not.toContain(
      "VEHICLE_CREATED",
    );
  });

  it("honours the bound it is given", async () => {
    const actor = await createActor();
    await database.auditLog.createMany({
      data: Array.from({ length: 5 }, () => ({
        userId: actor.id,
        action: "ADMIN_GRANTED",
        resourceType: "UserRole",
        resourceId: actor.id,
      })),
    });

    await expect(repository.listRecentAdministrative(3)).resolves.toHaveLength(
      3,
    );
  });

  it("reports a system action with no administrator behind it", async () => {
    await database.auditLog.create({
      data: {
        userId: null,
        action: "INITIAL_ADMIN_BOOTSTRAPPED",
        resourceType: "UserRole",
        resourceId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
      },
    });

    const entries = await repository.listRecentAdministrative(100);
    const bootstrap = entries.find(
      (entry) =>
        entry.action === "INITIAL_ADMIN_BOOTSTRAPPED" &&
        entry.resourceId === "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
    );
    expect(bootstrap?.actorName).toBeNull();
  });

  it("describes what the administration area actually writes", async () => {
    const actor = await createActor();
    await database.auditLog.create({
      data: {
        userId: actor.id,
        action: "ADMIN_GRANTED",
        resourceType: "UserRole",
        resourceId: actor.id,
        metadata: { email: "owner@example.com", source: "ADMIN_GRANT" },
      },
    });

    // Metadata survives the round trip through Json and still reads correctly.
    const entries = await repository.listRecentAdministrative(100);
    const granted = entries.find(
      (entry) =>
        entry.action === "ADMIN_GRANTED" && entry.actorName === "Ops Lead",
    );
    expect(granted && describeAuditEntry(granted)).toBe(
      "Granted administrator access (owner@example.com).",
    );
  });
});
