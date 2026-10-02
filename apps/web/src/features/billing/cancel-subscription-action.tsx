"use client";

import { Button } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelSubscriptionAction() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function cancel() {
    setState("submitting");
    try {
      const response = await fetch("/api/billing/subscriptions/cancel", { method: "POST" });
      if (!response.ok) throw new Error("Cancel failed");
      setState("done");
      router.refresh();
    } catch { setState("error"); }
  }

  return (
    <div>
      <Button disabled={state === "submitting" || state === "done"} onClick={cancel} variant="secondary">
        {state === "submitting" ? "Cancelling…" : "Cancel subscription"}
      </Button>
      <span aria-live="polite">{state === "done" ? "Cancellation scheduled for the end of this billing period." : state === "error" ? "Could not schedule cancellation. Please try again." : null}</span>
    </div>
  );
}
