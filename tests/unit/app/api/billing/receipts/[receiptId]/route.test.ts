import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { GET } from "../../../../../../../apps/web/src/app/api/billing/receipts/[receiptId]/route";
import { getCurrentSession } from "../../../../../../../apps/web/src/server/auth/get-current-session";
import { getBillingRuntime } from "../../../../../../../apps/web/src/server/billing/billing-runtime";
import { BillingService } from "../../../../../../../apps/web/src/server/billing/billing-service";
import { createDatabaseClient } from "../../../../../../../packages/database-runtime/src/client";

vi.mock("../../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("../../../../../../../apps/web/src/server/billing/billing-runtime", () => ({ getBillingRuntime: vi.fn() }));

describe("receipt owner route", () => {
  it("returns 404 when the tenant-scoped lookup finds no receipt", async () => {
    const receiptId = randomUUID();
    const database = createDatabaseClient({ connectionString: "postgresql://postgres:postgres@localhost:5432/test" });
    const findFirst = vi.spyOn(database.receipt, "findFirst").mockResolvedValue(null);
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1", userId: "owner-id", expiresAt: new Date("2026-10-01"),
      user: { id: "owner-id", displayName: null, primaryEmail: null, primaryPhone: null },
    });
    vi.mocked(getBillingRuntime).mockReturnValue({ database, service: new BillingService(database, {
      APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123", RAZORPAY_KEY_SECRET: "secret", RAZORPAY_WEBHOOK_SECRET: "webhook",
    }) });
    const response = await GET(new Request("https://app.example.test/api/billing/receipts/" + receiptId), { params: Promise.resolve({ receiptId }) });
    expect(response.status).toBe(404);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: receiptId, userId: "owner-id" } }));
    await database.$disconnect();
  });
});
