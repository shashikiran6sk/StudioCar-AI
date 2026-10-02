import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/billing/subscriptions/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

describe("POST billing subscriptions", () => {
  it("requires a signed-in user", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(new Request("https://app.example.test/api/billing/subscriptions", {
      method: "POST", headers: { origin: "https://app.example.test" }, body: JSON.stringify({ planCode: "STUDIO_PRO_MONTHLY" }),
    }));
    expect(response.status).toBe(401);
  });

  it("refuses browser-controlled amounts", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1", userId: "user-1", expiresAt: new Date("2026-10-01"),
      user: { id: "user-1", displayName: null, primaryEmail: null, primaryPhone: null },
    });
    const response = await POST(new Request("https://app.example.test/api/billing/subscriptions", {
      method: "POST", headers: { origin: "https://app.example.test" }, body: JSON.stringify({ planCode: "STUDIO_PRO_MONTHLY", amount: 1 }),
    }));
    expect(response.status).toBe(400);
  });
});
