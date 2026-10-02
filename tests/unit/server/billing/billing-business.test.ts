import { describe, expect, it } from "vitest";

import { BillingBusinessSchema } from "../../../../apps/web/src/server/billing/billing-business";

const business = {
  businessType: "SOLE_PROPRIETORSHIP",
  legalProprietorName: "Example Proprietor",
  legalBusinessName: "Example Business",
  tradingName: "Example Trade",
  productBrandName: "StudioCar AI",
  businessAddress: "Example address",
  billingEmail: "billing@example.com",
  supportEmail: "support@example.com",
  gstRegistered: false,
  gstin: null,
};

describe("billing business configuration", () => {
  it("requires legal merchant identity and explicit non-GST state", () => {
    expect(BillingBusinessSchema.parse(business)).toMatchObject(business);
  });

  it("rejects a GSTIN on a non-registered merchant", () => {
    expect(BillingBusinessSchema.safeParse({ ...business, gstin: "ABCDE1234F1Z5" }).success).toBe(false);
  });
});
