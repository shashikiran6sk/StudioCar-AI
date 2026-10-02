import { describe, expect, it, vi } from "vitest";

import { GET } from "../../../../../../apps/web/src/app/api/billing/receipts/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

describe("GET billing receipts", () => {
  it("does not reveal a receipt list without a session", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
});
