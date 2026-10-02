import { getCurrentSession } from "../../../../../server/auth/get-current-session";
import { isSameOriginRequest } from "../../../../../server/auth/is-same-origin-request";
import { getBillingRuntime } from "../../../../../server/billing/billing-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const cancelled = await getBillingRuntime().service.cancelSubscription(session.userId);
    return Response.json({ cancelAtPeriodEnd: cancelled }, { status: cancelled ? 200 : 404 });
  } catch {
    return Response.json({ error: "Cancellation is unavailable" }, { status: 503 });
  }
}
