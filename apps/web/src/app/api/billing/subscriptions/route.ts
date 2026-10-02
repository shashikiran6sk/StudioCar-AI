import { CreateBillingSubscriptionSchema } from "@studiocar/contracts";

import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { isSameOriginRequest } from "../../../../server/auth/is-same-origin-request";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = CreateBillingSubscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid plan" }, { status: 400 });
  try {
    return Response.json(await getBillingRuntime().service.createSubscription(session.userId));
  } catch {
    return Response.json({ error: "Subscription checkout is unavailable" }, { status: 503 });
  }
}
