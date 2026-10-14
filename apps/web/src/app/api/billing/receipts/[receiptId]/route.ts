import { z } from "zod";

import { getCurrentSession } from "../../../../../server/auth/get-current-session";
import { getBillingRuntime } from "../../../../../server/billing/billing-runtime";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ receiptId: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { receiptId } = await context.params;
  if (!z.uuid().safeParse(receiptId).success) return Response.json({ error: "Not found" }, { status: 404 });
  const receipt = await getBillingRuntime().database.receipt.findFirst({
    where: { id: receiptId, userId: session.userId },
    include: { payment: { select: { razorpayPaymentId: true, razorpayOrderId: true, status: true } } },
  });
  return receipt
    ? Response.json(receipt, { headers: { "cache-control": "private, no-store" } })
    : Response.json({ error: "Not found" }, { status: 404 });
}
