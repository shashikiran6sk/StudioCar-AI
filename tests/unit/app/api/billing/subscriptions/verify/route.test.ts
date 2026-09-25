import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/billing/subscriptions/verify/route";
import { getCurrentSession } from "../../../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));

describe("POST subscription verification", () => {
  it("requires authentication before accepting Checkout data", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    const response = await POST(new Request("https://app.example.test/api/billing/subscriptions/verify", {
      method: "POST", headers: { origin: "https://app.example.test" }, body: "{}",
    }));
    expect(response.status).toBe(401);
  });
});
