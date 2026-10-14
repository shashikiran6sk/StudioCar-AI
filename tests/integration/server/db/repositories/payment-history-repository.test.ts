import type { Prisma } from "../../../../../packages/database-runtime/src/index";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaPaymentHistoryRepository } from "../../../../../apps/web/src/server/db/repositories/payment-history-repository";
import { BILLING_PAYMENT_HISTORY_LIMIT } from "../../../../../apps/web/src/server/billing/billing.constants";

const databaseUrl = process.env["DATABASE_URL"];
(databaseUrl ? describe : describe.skip)("payment history ownership and bounds", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let ownerId: string;
  let otherId: string;
  beforeAll(async () => {
    if (!databaseUrl) throw new Error("Database required");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    ownerId = (await database.user.create({ data: { primaryEmail: `history-${randomUUID()}@example.test` } })).id;
    otherId = (await database.user.create({ data: { primaryEmail: `other-history-${randomUUID()}@example.test` } })).id;
  });
  afterAll(async () => {
    await database.payment.deleteMany({ where: { userId: { in: [ownerId, otherId] } } });
    await database.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await database.$disconnect();
  });

  it("never returns another tenant's pending or failed purchases", async () => {
    const other = await database.payment.create({ data: { userId: otherId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", amountPaise: 199900, currency: "INR", includedImages: 100 } });
    const owned = await database.payment.create({ data: { userId: ownerId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", amountPaise: 199900, currency: "INR", includedImages: 100, status: "FAILED" } });
    const history = await new PrismaPaymentHistoryRepository(database).findForUser(ownerId);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: owned.id, status: "FAILED", paidAt: null });
    expect(history.map((payment) => payment.id)).not.toContain(other.id);
    expect(history[0]).not.toHaveProperty("userId");
  });

  it("returns a bounded latest-first history", async () => {
    await database.payment.createMany({ data: Array.from({ length: BILLING_PAYMENT_HISTORY_LIMIT + 5 }, (_, index) => ({
      userId: ownerId, productCode: "STUDIO_PLUS", billingType: "ONE_TIME", amountPaise: 199900, currency: "INR", includedImages: 100,
      createdAt: new Date(Date.UTC(2030, 0, index + 1)),
    } satisfies Prisma.PaymentCreateManyInput)) });
    const history = await new PrismaPaymentHistoryRepository(database).findForUser(ownerId);
    expect(history).toHaveLength(BILLING_PAYMENT_HISTORY_LIMIT);
    expect(history.every((payment, index) => index === 0 || payment.createdAt <= (history[index - 1]?.createdAt ?? ""))).toBe(true);
  });
});
