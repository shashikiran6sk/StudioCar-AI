import { z } from "zod";
import type { Prisma } from "@studiocar/database-runtime";

export const BILLING_BUSINESS_CONFIG_KEY = "billing-business";

export const BillingBusinessSchema = z.object({
  businessType: z.literal("SOLE_PROPRIETORSHIP"),
  legalProprietorName: z.string().trim().min(1).max(160),
  legalBusinessName: z.string().trim().min(1).max(160),
  tradingName: z.string().trim().min(1).max(160),
  productBrandName: z.literal("StudioCar AI"),
  businessAddress: z.string().trim().min(1).max(1000),
  billingEmail: z.email(),
  supportEmail: z.email(),
  gstRegistered: z.boolean(),
  gstin: z.string().trim().length(15).nullable(),
}).strict().superRefine((value, context) => {
  if (value.gstRegistered !== (value.gstin !== null)) {
    context.addIssue({ code: "custom", path: ["gstin"], message: "GST registration and GSTIN must agree." });
  }
});

export type BillingBusiness = z.infer<typeof BillingBusinessSchema>;

export async function getBillingBusiness(transaction: Prisma.TransactionClient): Promise<BillingBusiness> {
  const row = await transaction.appConfig.findUnique({
    where: { key: BILLING_BUSINESS_CONFIG_KEY },
    select: { value: true },
  });
  if (!row) throw new Error("Billing business configuration is missing.");
  return BillingBusinessSchema.parse(row.value);
}
