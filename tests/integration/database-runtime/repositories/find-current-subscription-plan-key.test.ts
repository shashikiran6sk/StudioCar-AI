import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { findCurrentSubscriptionPlanKey } from "../../../../packages/database-runtime/src/repositories/find-current-subscription-plan-key";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "plan-key-owner@integration.studiocar.test";
const OTHER_EMAIL = "plan-key-other@integration.studiocar.test";
const NOW = new Date("2099-06-15T00:00:00.000Z");

databaseDescribe("findCurrentSubscriptionPlanKey", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [OWNER_EMAIL, OTHER_EMAIL] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function owner(email = OWNER_EMAIL): Promise<string> {
    return (await database.user.create({ data: { primaryEmail: email } })).id;
  }

  async function subscribe(
    userId: string,
    planKey: string,
    status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING",
    currentPeriodEnd: Date,
    source: "MANUAL_ADMIN" | "PAYMENT_PROVIDER" = "MANUAL_ADMIN",
  ): Promise<void> {
    await database.planSubscription.create({
      data: {
        currentPeriodEnd,
        currentPeriodStart: new Date("2099-01-01T00:00:00.000Z"),
        planKey,
        source,
        status,
        userId,
      },
    });
  }

  it("returns null for an account that never subscribed", async () => {
    await expect(findCurrentSubscriptionPlanKey(database, await owner(), NOW)).resolves.toBeNull();
  });

  it("returns an active or trialing plan until its period ends", async () => {
    const userId = await owner();
    await subscribe(userId, "STUDIO_PLUS", "TRIALING", new Date("2099-07-01T00:00:00.000Z"));
    await expect(findCurrentSubscriptionPlanKey(database, userId, NOW)).resolves.toBe("STUDIO_PLUS");
    await expect(
      findCurrentSubscriptionPlanKey(database, userId, new Date("2099-07-01T00:00:00.000Z")),
    ).resolves.toBeNull();
  });

  it.each(["CANCELLED", "EXPIRED", "PAST_DUE"] as const)(
    "ignores a %s subscription",
    async (status) => {
      const userId = await owner();
      await subscribe(userId, "STUDIO_PRO", status, new Date("2099-12-31T00:00:00.000Z"));
      await expect(findCurrentSubscriptionPlanKey(database, userId, NOW)).resolves.toBeNull();
    },
  );

  it("prefers the subscription that runs longest", async () => {
    const userId = await owner();
    await subscribe(userId, "STUDIO_PLUS", "ACTIVE", new Date("2099-07-01T00:00:00.000Z"));
    await subscribe(
      userId,
      "STUDIO_PRO",
      "ACTIVE",
      new Date("2099-12-31T00:00:00.000Z"),
      "PAYMENT_PROVIDER",
    );
    await expect(findCurrentSubscriptionPlanKey(database, userId, NOW)).resolves.toBe("STUDIO_PRO");
  });

  it("never reads another account's subscription", async () => {
    const userId = await owner();
    await subscribe(await owner(OTHER_EMAIL), "STUDIO_PRO", "ACTIVE", new Date("2099-12-31T00:00:00.000Z"));
    await expect(findCurrentSubscriptionPlanKey(database, userId, NOW)).resolves.toBeNull();
  });
});
