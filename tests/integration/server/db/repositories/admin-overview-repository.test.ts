import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAdminOverviewRepository } from "../../../../../apps/web/src/server/db/repositories/admin-overview-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "overview-owner@integration.studiocar.test";

databaseDescribe("PrismaAdminOverviewRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaAdminOverviewRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaAdminOverviewRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: ownerEmail } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns only numbers, so nothing personal can leak through it", async () => {
    const summary = await repository.summarise();

    expect(Object.values(summary).every((value) => typeof value === "number")).toBe(
      true,
    );
    expect(Object.keys(summary).sort()).toEqual(
      [
        "activePlanCount",
        "activeSubscriptionCount",
        "administratorCount",
        "enabledSocialLinkCount",
        "manualSubscriptionCount",
        "userCount",
      ].sort(),
    );
  });

  it("counts a manual subscription separately from the total", async () => {
    const before = await repository.summarise();
    const owner = await database.user.create({
      data: { primaryEmail: ownerEmail },
    });
    await database.planSubscription.create({
      data: {
        userId: owner.id,
        source: "MANUAL_ADMIN",
        planKey: "STUDIO_PLUS",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
      },
    });

    const after = await repository.summarise();
    expect(after.activeSubscriptionCount).toBe(
      before.activeSubscriptionCount + 1,
    );
    expect(after.manualSubscriptionCount).toBe(
      before.manualSubscriptionCount + 1,
    );
  });

  it("ignores a cancelled subscription", async () => {
    const before = await repository.summarise();
    const owner = await database.user.create({
      data: { primaryEmail: ownerEmail },
    });
    await database.planSubscription.create({
      data: {
        userId: owner.id,
        source: "MANUAL_ADMIN",
        planKey: "STUDIO_PRO",
        status: "CANCELLED",
        currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
      },
    });

    const after = await repository.summarise();
    expect(after.activeSubscriptionCount).toBe(before.activeSubscriptionCount);
  });
});
