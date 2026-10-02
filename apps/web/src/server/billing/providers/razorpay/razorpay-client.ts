import { z } from "zod";
import type { RazorpayEnvironment } from "@studiocar/config";

const RazorpayOrderSchema = z.object({ id: z.string().startsWith("order_") });
const RazorpaySubscriptionSchema = z.object({
  id: z.string().startsWith("sub_"),
  plan_id: z.string().startsWith("plan_"),
});
const RazorpayPlanSchema = z.object({ id: z.string().startsWith("plan_") });

export class RazorpayClient {
  public constructor(private readonly environment: RazorpayEnvironment) {}

  private async request(path: string, method: "GET" | "POST", body?: unknown): Promise<unknown> {
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.environment.RAZORPAY_KEY_ID}:${this.environment.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Razorpay request failed (${String(response.status)}).`);
    return response.json();
  }

  public async createOrder(input: { amount: number; currency: string; receipt: string; userId: string }) {
    return RazorpayOrderSchema.parse(await this.request("orders", "POST", {
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      partial_payment: false,
      notes: { userId: input.userId, productCode: "STUDIO_PLUS" },
    }));
  }

  public async createSubscription(input: { planId: string; userId: string; subscriptionId: string }) {
    return RazorpaySubscriptionSchema.parse(await this.request("subscriptions", "POST", {
      plan_id: input.planId,
      total_count: 120,
      quantity: 1,
      customer_notify: false,
      notes: { userId: input.userId, planCode: "STUDIO_PRO_MONTHLY", internalSubscriptionId: input.subscriptionId },
    }));
  }

  public async cancelSubscription(id: string): Promise<void> {
    await this.request(`subscriptions/${encodeURIComponent(id)}/cancel`, "POST", {
      cancel_at_cycle_end: true,
    });
  }

  public async createPlan(input: { amount: number; currency: string }) {
    return RazorpayPlanSchema.parse(await this.request("plans", "POST", {
      period: "monthly",
      interval: 1,
      item: {
        name: "StudioCar Pro",
        amount: input.amount,
        currency: input.currency,
        description: "StudioCar Pro Monthly",
      },
    }));
  }
}
