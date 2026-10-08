import { z } from "zod";
import { PLUS_PRODUCT, RazorpayPaymentEntitySchema } from "@studiocar/contracts";
import type { RazorpayEnvironment } from "@studiocar/config";

const RazorpayOrderSchema = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/) });
const OrderPaymentsSchema = z.object({ items: z.array(RazorpayPaymentEntitySchema) });
const RAZORPAY_API_URL = "https://api.razorpay.com/v1/";
const RAZORPAY_REQUEST_TIMEOUT_MS = 15_000;

export class RazorpayClient {
  public constructor(private readonly environment: RazorpayEnvironment) {}
  private async request(path: string, method: "GET" | "POST", body?: unknown): Promise<unknown> {
    const response = await fetch(`${RAZORPAY_API_URL}${path}`, {
      method,
      headers: {
        authorization: `Basic ${Buffer.from(`${this.environment.RAZORPAY_KEY_ID}:${this.environment.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store", signal: AbortSignal.timeout(RAZORPAY_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Razorpay request failed (${String(response.status)}).`);
    return response.json();
  }
  public async createOrder(input: { amount: number; currency: string; receipt: string; userId: string }) {
    return RazorpayOrderSchema.parse(await this.request("orders", "POST", {
      amount: input.amount, currency: input.currency, receipt: input.receipt,
      partial_payment: false, notes: { userId: input.userId, productCode: PLUS_PRODUCT.code },
    }));
  }
  public async getOrder(orderId: string) {
    return RazorpayOrderSchema.extend({ amount: z.number().int().positive(), currency: z.string().length(3), receipt: z.uuid() }).parse(await this.request(`orders/${encodeURIComponent(orderId)}`, "GET"));
  }
  public async getOrderPayments(orderId: string) {
    return OrderPaymentsSchema.parse(await this.request(`orders/${encodeURIComponent(orderId)}/payments`, "GET")).items;
  }
}
