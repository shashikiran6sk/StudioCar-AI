import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { LOCAL_INFRASTRUCTURE } from "../../../../packages/config/src/local-infrastructure";
import { getWebDatabase } from "../../../../apps/web/src/server/db/web-database";
import { PrismaPaymentHistoryRepository } from "../../../../apps/web/src/server/db/repositories/payment-history-repository";
import { getPaymentHistory } from "../../../../apps/web/src/server/billing/get-payment-history";

vi.mock("../../../../apps/web/src/server/db/web-database", () => ({ getWebDatabase: vi.fn() }));
const database = createDatabaseClient({ connectionString: LOCAL_INFRASTRUCTURE.databaseUrl, log: [] });
afterEach(() => vi.restoreAllMocks());
afterAll(async () => database.$disconnect());

describe("getPaymentHistory", () => {
  it("reads owner-scoped history without requiring Razorpay credentials", async () => {
    vi.mocked(getWebDatabase).mockReturnValue(database);
    const read = vi.spyOn(PrismaPaymentHistoryRepository.prototype, "findForUser").mockResolvedValue([]);
    await expect(getPaymentHistory("owner-1")).resolves.toEqual([]);
    expect(read).toHaveBeenCalledWith("owner-1");
  });

  it("propagates an unavailable database instead of displaying a fabricated empty history", async () => {
    vi.mocked(getWebDatabase).mockReturnValue(database);
    vi.spyOn(PrismaPaymentHistoryRepository.prototype, "findForUser").mockRejectedValue(new Error("Database unavailable"));
    await expect(getPaymentHistory("owner-1")).rejects.toThrow("Database unavailable");
  });
});
