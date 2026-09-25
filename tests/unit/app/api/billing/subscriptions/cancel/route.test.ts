import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/billing/subscriptions/cancel/route";
import { getCurrentSession } from "../../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

describe("POST subscription cancellation", () => {
  it("requires authentication and same-origin intent", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(new Request("https://app.example.test/api/billing/subscriptions/cancel", {
      method: "POST", headers: { origin: "https://app.example.test" },
    }));
    expect(response.status).toBe(401);
    const crossOrigin = await POST(new Request("https://app.example.test/api/billing/subscriptions/cancel", {
      method: "POST", headers: { origin: "https://attacker.example.test" },
    }));
    expect(crossOrigin.status).toBe(403);
  });
});
