import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { findOwnedPlanKey } from "../../../../packages/database-runtime/src/repositories/find-owned-plan-key";
const url = process.env["DATABASE_URL"];
(url ? describe : describe.skip)("findOwnedPlanKey", () => {
 let database: ReturnType<typeof createDatabaseClient>; let userId: string;
 beforeAll(async () => { if (!url) throw new Error("Database required"); database = createDatabaseClient({ connectionString: url, log: [] }); userId = (await database.user.create({ data: { primaryEmail: `${randomUUID()}@plan.test` } })).id; });
 afterAll(async () => { await database.creditLedger.deleteMany({ where: { userId } }); await database.user.delete({ where: { id: userId } }); await database.$disconnect(); });
 it("returns free without a purchase and retains Plus after consumption", async () => {
  expect(await findOwnedPlanKey(database, userId)).toBeNull();
  await database.creditLedger.createMany({ data: [{ userId, amount: 100, type: "PURCHASE_GRANT", referenceId: randomUUID() }, { userId, amount: -100, type: "PROCESSING_DEBIT", referenceId: randomUUID() }] });
  expect(await findOwnedPlanKey(database, userId)).toBe("STUDIO_PLUS");
 });
});
