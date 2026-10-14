import { describe, expect, it, vi } from "vitest";

import { GET } from "../../../../../../apps/web/src/app/api/billing/status/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

describe("GET billing status", () => {
  it("does not reveal usage without a session", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    expect((await GET(new Request("https://app.example.test/api/billing/status"))).status).toBe(401);
  });
});
