import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../apps/web/src/app/api/billing/orders/route";
import { getCurrentSession } from "../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

const url = "https://app.example.test/api/billing/orders";

afterEach(() => { vi.clearAllMocks(); });

describe("POST billing orders", () => {
  it("keeps authentication required for a matching HTTPS tunnel origin", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(new Request("http://localhost:3000/api/billing/orders", {
      method: "POST", body: "{}",
      headers: { origin: "https://studiocar-local.trycloudflare.com", host: "studiocar-local.trycloudflare.com", "x-forwarded-proto": "https" },
    }));
    expect(response.status).toBe(401);
  });

  it("rejects a forged forwarded host before looking up a session", async () => {
    const response = await POST(new Request("http://localhost:3000/api/billing/orders", {
      method: "POST", body: "{}",
      headers: { origin: "https://attacker.example", host: "studiocar-local.trycloudflare.com", "x-forwarded-host": "attacker.example", "x-forwarded-proto": "https" },
    }));
    expect(response.status).toBe(403);
    expect(getCurrentSession).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(new Request(url, { method: "POST", headers: { origin: "https://app.example.test" }, body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("rejects a client price override before calling billing", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1", userId: "user-1", expiresAt: new Date("2026-10-01"),
      user: { id: "user-1", displayName: null, primaryEmail: null, primaryPhone: null },
    });
    const response = await POST(new Request(url, { method: "POST", headers: { origin: "https://app.example.test" }, body: JSON.stringify({ productCode: "STUDIO_PLUS", amount: 1 }) }));
    expect(response.status).toBe(400);
  });
});
