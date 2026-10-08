import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaAdminOverviewRepository } from "../../../../../apps/web/src/server/db/repositories/admin-overview-repository";
const url = process.env["DATABASE_URL"];
(url ? describe : describe.skip)("Plus admin overview", () => {
  let database: ReturnType<typeof createDatabaseClient>; let userId: string;
  beforeAll(async () => { if (!url) throw new Error("Database required"); database = createDatabaseClient({ connectionString: url, log: [] });
    userId = (await database.user.create({ data: { primaryEmail: `${randomUUID()}@overview.test` } })).id; });
  afterAll(async () => { await database.creditLedger.deleteMany({ where: { userId } }); await database.user.delete({ where: { id: userId } }); await database.$disconnect(); });
  it("counts repeat purchasers once and reports numbers only", async () => {
    const repository = new PrismaAdminOverviewRepository(database); const before = await repository.summarise();
    await database.creditLedger.createMany({ data: [0, 1].map(() => ({ userId, amount: 100, type: "PURCHASE_GRANT", referenceId: randomUUID() })) });
    const after = await repository.summarise(); expect(after.paidAccountCount).toBe(before.paidAccountCount + 1);
    expect(Object.values(after).every((value) => typeof value === "number")).toBe(true);
  });
});
