import type { Prisma } from "@studiocar/database-runtime";

import { getBillingBusiness } from "./billing-business";

export async function createReceipt(
  transaction: Prisma.TransactionClient,
  input: {
    paymentId: string;
    userId: string;
    productCode: string;
    amountPaise: number;
    currency: string;
    paidAt: Date;
    paymentMethod: string | null;
  },
): Promise<void> {
  const business = await getBillingBusiness(transaction);
  if (business.gstRegistered) {
    throw new Error("GST tax invoice configuration is required before accepting payments.");
  }
  const user = await transaction.user.findUniqueOrThrow({
    where: { id: input.userId },
    select: { displayName: true, primaryEmail: true, primaryPhone: true },
  });
  const sequence = await transaction.$queryRaw<{ number: bigint }[]>`SELECT nextval('"BillingReceiptNumber_seq"') AS number`;
  const number = sequence[0]?.number;
  if (number === undefined) throw new Error("Receipt sequence is unavailable.");
  const receiptNumber = `SC-${String(input.paidAt.getUTCFullYear())}-${String(number).padStart(6, "0")}`;
  const plus = input.productCode === "STUDIO_PLUS";
  await transaction.receipt.create({
    data: {
      receiptNumber,
      paymentId: input.paymentId,
      userId: input.userId,
      productCode: input.productCode,
      productName: plus ? "Studio Plus" : "Studio Pro",
      description: plus ? "100 image credits" : "Monthly subscription — 400 images",
      subtotalPaise: input.amountPaise,
      taxPaise: 0,
      totalPaise: input.amountPaise,
      currency: input.currency,
      paidAt: input.paidAt,
      paymentMethod: input.paymentMethod,
      customerName: user.displayName,
      customerEmail: user.primaryEmail,
      customerPhone: user.primaryPhone,
      businessType: business.businessType,
      businessLegalName: business.legalBusinessName,
      tradingName: business.tradingName,
      proprietorName: business.legalProprietorName,
      businessAddress: business.businessAddress,
      billingEmail: business.billingEmail,
      businessGstin: null,
    },
  });
}
