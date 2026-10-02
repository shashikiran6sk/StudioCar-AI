import { parseRazorpayEnvironment } from "@studiocar/config";
import { RazorpayWebhookSchema } from "@studiocar/contracts";

import { getBillingRuntime } from "../../../../server/billing/billing-runtime";
import { processRazorpayWebhook } from "../../../../server/billing/process-razorpay-webhook";
import { verifyRazorpaySignature } from "../../../../server/billing/providers/razorpay/verify-signature";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const environment = parseRazorpayEnvironment(process.env);
  if (!verifyRazorpaySignature(rawBody, signature, environment.RAZORPAY_WEBHOOK_SECRET)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!eventId || eventId.length > 255) return Response.json({ error: "Missing event ID" }, { status: 400 });
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return Response.json({ error: "Invalid event" }, { status: 400 }); }
  const event = RazorpayWebhookSchema.safeParse(body);
  if (!event.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  try {
    await processRazorpayWebhook(getBillingRuntime().database, eventId, event.data);
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Event processing failed" }, { status: 503 });
  }
}
