import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CancelSubscriptionAction } from "../../../../apps/web/src/features/billing/cancel-subscription-action";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

describe("CancelSubscriptionAction", () => {
  it("requests the signed-in subscription without sending a provider ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ cancelAtPeriodEnd: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<CancelSubscriptionAction />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await waitFor(() => expect(screen.getByText(/Cancellation scheduled/)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/billing/subscriptions/cancel", { method: "POST" });
  });
});
