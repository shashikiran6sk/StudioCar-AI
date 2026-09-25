import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const receipts = await getBillingRuntime().database.receipt.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, receiptNumber: true, productName: true, description: true,
      totalPaise: true, currency: true, paidAt: true,
      payment: { select: { status: true } },
    },
  });
  return Response.json({ receipts }, { headers: { "cache-control": "private, no-store" } });
}
