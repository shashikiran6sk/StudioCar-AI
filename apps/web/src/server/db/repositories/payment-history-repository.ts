import type { PrismaClient } from "@studiocar/database-runtime";
import { PaymentHistoryEntrySchema } from "@studiocar/contracts";
import { BILLING_PAYMENT_HISTORY_LIMIT } from "../../billing/billing.constants";

export class PrismaPaymentHistoryRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async findForUser(userId: string) {
    const payments = await this.database.payment.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: BILLING_PAYMENT_HISTORY_LIMIT,
      select: { id: true, createdAt: true, paidAt: true, productCode: true, amountPaise: true,
        currency: true, status: true, razorpayOrderId: true, razorpayPaymentId: true },
    });
    return payments.map((payment) => PaymentHistoryEntrySchema.parse({
      ...payment, createdAt: payment.createdAt.toISOString(), paidAt: payment.paidAt?.toISOString() ?? null,
    }));
  }

}
