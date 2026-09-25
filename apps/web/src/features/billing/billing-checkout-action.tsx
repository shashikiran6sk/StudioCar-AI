"use client";

import { Button, type ButtonVariant } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const CheckoutResponseSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  razorpay_order_id: z.string().optional(),
  razorpay_subscription_id: z.string().optional(),
});

const OrderResponseSchema = z.object({
  orderId: z.string(), keyId: z.string(), amount: z.number(), currency: z.string(), name: z.string(),
});
const SubscriptionResponseSchema = z.object({
  subscriptionId: z.string(), keyId: z.string(), amount: z.number(), currency: z.string(), name: z.string(),
});

interface CheckoutOptions {
  key: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  handler: (response: unknown) => void;
  modal: { ondismiss: () => void };
}

interface CheckoutInstance {
  open(): void;
  on(event: "payment.failed", listener: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => CheckoutInstance;
  }
}

export interface BillingCheckoutActionProps {
  includedImages: number;
  label: string;
  planKey: string;
  variant: ButtonVariant;
}

export function BillingCheckoutAction({ includedImages, label, planKey, variant }: BillingCheckoutActionProps) {
  const router = useRouter();
  const checkoutCallbackReceived = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<"idle" | "opening" | "verifying" | "confirming" | "confirmed" | "error" | "script-error">("idle");
  const [reference, setReference] = useState<{ orderId?: string; subscriptionId?: string } | null>(null);
  const isPlus = planKey === "STUDIO_PLUS";

  useEffect(() => {
    if (state !== "confirming" || !reference) return;
    let cancelled = false;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      if (attempts > 15) {
        window.clearInterval(timer);
        if (!cancelled) setState("error");
        return;
      }
      const query = reference.orderId
        ? `orderId=${encodeURIComponent(reference.orderId)}`
        : `subscriptionId=${encodeURIComponent(reference.subscriptionId ?? "")}`;
      try {
        const response = await fetch(`/api/billing/status?${query}`, { cache: "no-store" });
        if (!response.ok) return;
        const status: unknown = await response.json();
        const parsed = z.object({
          checkoutPaymentStatus: z.string().nullable(),
          checkoutSubscriptionStatus: z.string().nullable(),
          subscription: z.object({ remaining: z.number() }).nullable(),
        }).safeParse(status);
        if (!parsed.success) return;
        const confirmed = reference.orderId
          ? parsed.data.checkoutPaymentStatus === "PAID"
          : parsed.data.checkoutSubscriptionStatus === "ACTIVE" && (parsed.data.subscription?.remaining ?? 0) > 0;
        if (confirmed && !cancelled) {
          window.clearInterval(timer);
          setState("confirmed");
          router.refresh();
        }
      } catch { /* Retry during the bounded confirmation window. */ }
    }, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [reference, router, state]);

  async function startCheckout() {
    if (!scriptReady || !window.Razorpay || state === "opening") return;
    checkoutCallbackReceived.current = false;
    setState("opening");
    try {
      const response = await fetch(isPlus ? "/api/billing/orders" : "/api/billing/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isPlus ? { productCode: "STUDIO_PLUS" } : { planCode: "STUDIO_PRO_MONTHLY" }),
      });
      if (!response.ok) throw new Error("Checkout unavailable");
      const body: unknown = await response.json();
      const checkout = isPlus ? OrderResponseSchema.parse(body) : SubscriptionResponseSchema.parse(body);
      const orderId = "orderId" in checkout ? checkout.orderId : undefined;
      const subscriptionId = "subscriptionId" in checkout ? checkout.subscriptionId : undefined;
      if (!orderId && !subscriptionId) throw new Error("Missing checkout reference");
      const instance = new window.Razorpay({
        key: checkout.keyId,
        name: "StudioCar AI",
        description: isPlus ? `Studio Plus — ${String(includedImages)} Image Credits` : `Studio Pro — monthly recurring, ${String(includedImages)} images`,
        ...(orderId ? { order_id: orderId } : subscriptionId ? { subscription_id: subscriptionId } : {}),
        handler: async (value: unknown) => {
          checkoutCallbackReceived.current = true;
          const callback = CheckoutResponseSchema.safeParse(value);
          if (!callback.success) { setState("error"); return; }
          setState("verifying");
          try {
            const verification = await fetch(isPlus ? "/api/billing/orders/verify" : "/api/billing/subscriptions/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(callback.data),
            });
            if (!verification.ok) throw new Error("Verification failed");
            setReference(orderId ? { orderId } : subscriptionId ? { subscriptionId } : null);
            setState("confirming");
          } catch { setState("error"); }
        },
        modal: { ondismiss: () => { if (!checkoutCallbackReceived.current) setState("idle"); } },
      });
      instance.on("payment.failed", () => setState("error"));
      instance.open();
    } catch { setState("error"); }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setState("script-error")}
      />
      <Button disabled={!scriptReady || state === "opening" || state === "verifying" || state === "confirming"} onClick={startCheckout} variant={variant}>
        {state === "opening" ? "Opening checkout…" : label}
      </Button>
      <span aria-live="polite" className="billing-checkout-status">
        {state === "confirming" || state === "verifying" ? "Payment received. Confirming your payment…" : null}
        {state === "confirmed" ? isPlus ? `Payment confirmed. ${String(includedImages)} credits have been added.` : `Studio Pro is active. ${String(includedImages)} images are available for the current billing period.` : null}
        {state === "error" ? "We could not confirm the payment yet. Check Usage & Billing before trying again." : null}
        {state === "script-error" ? "Checkout could not load. Refresh the page and try again." : null}
      </span>
    </>
  );
}
