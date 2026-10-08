"use client";

import { BillingOrderResponseSchema, BillingStatusSchema, PLUS_PRODUCT, VerifyBillingOrderSchema } from "@studiocar/contracts";
import { Button, type ButtonVariant } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { CHECKOUT_REQUEST_TIMEOUT_MS, CHECKOUT_SCRIPT_URL, CHECKOUT_POLL_INTERVAL_MS, CHECKOUT_POLL_ATTEMPTS, CHECKOUT_PENDING_MESSAGE, CHECKOUT_DELAYED_MESSAGE, CHECKOUT_ERROR_MESSAGE, CHECKOUT_SCRIPT_ERROR_MESSAGE } from "./billing-checkout.constants";

interface CheckoutOptions {
  key: string; name: string; description: string; order_id: string;
  amount: number; currency: string;
  handler: (response: unknown) => void;
  modal: { ondismiss: () => void };
}
interface CheckoutInstance { open(): void; on(event: "payment.failed", listener: () => void): void; }
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => CheckoutInstance; } }
export interface BillingCheckoutActionProps { label: string; variant: ButtonVariant; }

export function BillingCheckoutAction({ label, variant }: BillingCheckoutActionProps) {
  const router = useRouter();
  const callbackReceived = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<"idle" | "opening" | "verifying" | "confirming" | "confirmed" | "delayed" | "error" | "script-error">("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  useEffect(() => {
    if (state !== "confirming" || !orderId) return;
    const controller = new AbortController();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll(): Promise<void> {
      if (controller.signal.aborted) return;
      attempts += 1;
      try {
        const response = await fetch(`/api/billing/status?orderId=${encodeURIComponent(orderId ?? "")}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(CHECKOUT_REQUEST_TIMEOUT_MS)]) });
        const body: unknown = await response.json();
        const status = BillingStatusSchema.safeParse(body);
        if (response.ok && status.success) {
          if (["PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(status.data.checkoutPaymentStatus ?? "")) {
            if (!controller.signal.aborted) { setState("confirmed"); router.refresh(); }
            return;
          }
        }
      } catch { /* Retry safely without overlapping requests or starting a second purchase. */ }
      if (controller.signal.aborted) return;
      if (attempts >= CHECKOUT_POLL_ATTEMPTS) { setState("delayed"); return; }
      timer = setTimeout(() => { void poll(); }, CHECKOUT_POLL_INTERVAL_MS);
    }
    timer = setTimeout(() => { void poll(); }, CHECKOUT_POLL_INTERVAL_MS);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, router, state]);

  async function startCheckout(): Promise<void> {
    if (!scriptReady || !window.Razorpay || state === "opening") return;
    callbackReceived.current = false;
    setState("opening");
    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST", signal: AbortSignal.timeout(CHECKOUT_REQUEST_TIMEOUT_MS), headers: { "content-type": "application/json" },
        body: JSON.stringify({ productCode: PLUS_PRODUCT.code }),
      });
      if (!response.ok) throw new Error("Checkout unavailable");
      const body: unknown = await response.json();
      const checkout = BillingOrderResponseSchema.parse(body);
      setOrderId(checkout.orderId);
      const instance = new window.Razorpay({
        key: checkout.keyId, name: "StudioCar AI", description: `${PLUS_PRODUCT.name} — ${String(PLUS_PRODUCT.credits)} Image Credits`,
        order_id: checkout.orderId, amount: checkout.amount, currency: checkout.currency,
        handler: async (value: unknown) => {
          callbackReceived.current = true;
          const callback = VerifyBillingOrderSchema.safeParse(value);
          if (!callback.success || callback.data.razorpay_order_id !== checkout.orderId) { setState("delayed"); return; }
          setState("verifying");
          try {
            const verification = await fetch("/api/billing/orders/verify", {
              method: "POST", signal: AbortSignal.timeout(CHECKOUT_REQUEST_TIMEOUT_MS), headers: { "content-type": "application/json" }, body: JSON.stringify(callback.data),
            });
            if (!verification.ok) throw new Error("Verification failed");
            setState("confirming");
          } catch { setState("delayed"); }
        },
        modal: { ondismiss: () => { if (!callbackReceived.current) setState("idle"); } },
      });
      instance.on("payment.failed", () => setState("error"));
      instance.open();
    } catch { setState("error"); }
  }
  const busy = state === "opening" || state === "verifying" || state === "confirming";
  return <>
    <Script src={CHECKOUT_SCRIPT_URL} strategy="afterInteractive" onLoad={() => setScriptReady(true)} onReady={() => setScriptReady(true)} onError={() => setState("script-error")} />
    <Button disabled={!scriptReady || busy} onClick={state === "delayed" ? () => setState("confirming") : startCheckout} variant={variant}>
      {state === "opening" ? "Opening checkout…" : state === "delayed" ? "Check payment confirmation" : label}
    </Button>
    <span aria-live="polite" className="billing-checkout-status">
      {state === "confirming" || state === "verifying" ? CHECKOUT_PENDING_MESSAGE : null}
      {state === "confirmed" ? "Payment confirmed. View your credits and receipt in billing." : null}
      {state === "delayed" ? `${CHECKOUT_DELAYED_MESSAGE} Order: ${orderId ?? "unavailable"}` : null}
      {state === "error" ? CHECKOUT_ERROR_MESSAGE : null}
      {state === "script-error" ? CHECKOUT_SCRIPT_ERROR_MESSAGE : null}
    </span>
  </>;
}
