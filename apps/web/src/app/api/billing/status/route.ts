import { BillingStatusQuerySchema } from "@studiocar/contracts";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";
import { getBillingStatus } from "../../../../server/billing/get-billing-status";

export const runtime = "nodejs";
export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const query = BillingStatusQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return Response.json({ error: "Invalid billing query" }, { status: 400 });
  try {
    const status = await getBillingStatus(getBillingRuntime().database, session.userId, query.data);
    return Response.json(status, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Billing status is unavailable" }, { status: 503 });
  }
}
