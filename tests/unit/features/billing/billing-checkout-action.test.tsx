import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BillingCheckoutAction } from "../../../../apps/web/src/features/billing/billing-checkout-action";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next/script", () => ({ default: ({ onReady }: { onReady: () => void }) => <button onClick={onReady}>Load Checkout script</button> }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); refresh.mockReset(); });

function prepareCheckout() {
  let callback: ((response: unknown) => void) | undefined;
  class TestCheckout {
    public constructor(options: ConstructorParameters<NonNullable<typeof window.Razorpay>>[0]) { callback = options.handler; }
    public open(): void {}
    public on(): void {}
  }
  window.Razorpay = TestCheckout;
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ orderId: "order_test", keyId: "rzp_test_1", amount: 199900, currency: "INR", name: "StudioCar Plus" }))).mockResolvedValueOnce(new Response(JSON.stringify({ verified: true })));
  vi.stubGlobal("fetch", fetchMock);
  render(<BillingCheckoutAction label="Buy 100 More Credits" variant="secondary" />);
  fireEvent.click(screen.getByRole("button", { name: "Load Checkout script" }));
  return { fetchMock, complete: async () => {
    if (!callback) throw new Error("Checkout was not opened");
    await act(async () => callback?.({ razorpay_order_id: "order_test", razorpay_payment_id: "pay_test", razorpay_signature: "0".repeat(64) }));
  } };
}

describe("BillingCheckoutAction", () => {
  it("waits for script readiness", () => {
    render(<BillingCheckoutAction label="Buy Plus" variant="secondary" />);
    expect(screen.getByRole("button", { name: "Buy Plus" })).toBeDisabled();
  });
  it("never confirms credits from Checkout verification and waits for its captured order", async () => {
    vi.useFakeTimers(); const checkout = prepareCheckout();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Buy 100 More Credits" })));
    await checkout.complete();
    checkout.fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ purchasedCredits: 0, purchasedCreditsGranted: 0, checkoutPaymentStatus: "VERIFIED" })));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(refresh).not.toHaveBeenCalled(); expect(screen.getByText(/Payment is pending confirmation/)).toBeVisible();
    checkout.fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ purchasedCredits: 100, purchasedCreditsGranted: 100, checkoutPaymentStatus: "PAID" })));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(refresh).toHaveBeenCalledTimes(1); expect(screen.getByText(/Payment confirmed/)).toBeVisible();
  });
  it("lets delayed confirmation recover without creating a second purchase", async () => {
    vi.useFakeTimers(); const checkout = prepareCheckout();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Buy 100 More Credits" })));
    await checkout.complete();
    checkout.fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ purchasedCredits: 0, purchasedCreditsGranted: 0, checkoutPaymentStatus: "VERIFIED" }))));
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    expect(screen.getByText(/Confirmation is delayed/)).toBeVisible();
    checkout.fetchMock.mockClear();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Check payment confirmation" })));
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(checkout.fetchMock).toHaveBeenCalledTimes(1);
    expect(checkout.fetchMock.mock.calls[0]?.[0]).toBe("/api/billing/status?orderId=order_test");
    expect(refresh).not.toHaveBeenCalled();
  });
});
