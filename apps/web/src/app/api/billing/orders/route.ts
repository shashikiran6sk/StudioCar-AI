import { CreateBillingOrderSchema } from "@studiocar/contracts";

import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { isSameOriginRequest } from "../../../../server/auth/is-same-origin-request";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = CreateBillingOrderSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid product" }, { status: 400 });
  try {
    return Response.json(await getBillingRuntime().service.createOrder(session.userId));
  } catch {
    return Response.json({ error: "Checkout is unavailable" }, { status: 503 });
  }
}
