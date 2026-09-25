import { describe, expect, it, vi } from "vitest";

import ReceiptPage from "../../../../../../../apps/web/src/app/(app)/billing/receipts/[receiptId]/page";
import { getCurrentSession } from "../../../../../../../apps/web/src/server/auth/get-current-session";
import { redirect } from "next/navigation";

vi.mock("../../../../../../../apps/web/src/server/auth/get-current-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw new Error("redirected"); }),
  notFound: vi.fn(() => { throw new Error("not found"); }),
}));

describe("receipt print page", () => {
  it("redirects an unauthenticated visitor before reading a receipt", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    await expect(ReceiptPage({ params: Promise.resolve({ receiptId: "not-a-uuid" }) })).rejects.toThrow("redirected");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
