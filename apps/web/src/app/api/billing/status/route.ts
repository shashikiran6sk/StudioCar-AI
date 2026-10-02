import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";
import { getBillingStatus } from "../../../../server/billing/get-billing-status";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const database = getBillingRuntime().database;
    const status = await getBillingStatus(database, session.userId);
    const orderId = new URL(request.url).searchParams.get("orderId");
    const subscriptionId = new URL(request.url).searchParams.get("subscriptionId");
    const checkoutPayment = orderId && /^order_[A-Za-z0-9]+$/.test(orderId)
      ? await database.payment.findFirst({ where: { userId: session.userId, razorpayOrderId: orderId }, select: { status: true } })
      : null;
    const checkoutSubscription = subscriptionId && /^sub_[A-Za-z0-9]+$/.test(subscriptionId)
      ? await database.planSubscription.findFirst({ where: { userId: session.userId, providerSubscriptionId: subscriptionId }, select: { status: true } })
      : null;
    return Response.json({ ...status, checkoutPaymentStatus: checkoutPayment?.status ?? null, checkoutSubscriptionStatus: checkoutSubscription?.status ?? null }, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Billing status is unavailable" }, { status: 503 });
  }
}
