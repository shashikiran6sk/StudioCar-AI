import { describe, expect, it } from "vitest";

import {
  AccountLookupSchema,
  ManualSubscriptionAssignmentSchema,
  ManualSubscriptionPlanKeySchema,
} from "../../../packages/contracts/src/subscriptions";

const USER_ID = "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34";

describe("AccountLookupSchema", () => {
  it("accepts an email address, lower-cased", () => {
    expect(AccountLookupSchema.parse({ email: "  Owner@Example.COM " })).toEqual(
      { email: "owner@example.com" },
    );
  });

  it("accepts an Indian mobile number in any written form", () => {
    expect(AccountLookupSchema.parse({ phoneNumber: "098765 43210" })).toEqual({
      phoneNumber: "+919876543210",
    });
  });

  it("refuses a lookup that names both, which would be ambiguous", () => {
    expect(
      AccountLookupSchema.safeParse({
        email: "owner@example.com",
        phoneNumber: "+919876543210",
      }).success,
    ).toBe(false);
  });

  it("refuses a partial address, because there is no partial search", () => {
    expect(AccountLookupSchema.safeParse({ email: "owner@" }).success).toBe(
      false,
    );
  });
});

describe("ManualSubscriptionPlanKeySchema", () => {
  it("offers every paid plan", () => {
    expect(ManualSubscriptionPlanKeySchema.options).toEqual([
      "STUDIO_PACK",
      "STUDIO_PRO",
      "STUDIO_PLUS",
    ]);
  });

  it("refuses the free plan, which is the absence of a subscription", () => {
    expect(ManualSubscriptionPlanKeySchema.safeParse("FREE").success).toBe(
      false,
    );
  });
});

describe("ManualSubscriptionAssignmentSchema", () => {
  const assignment = {
    months: 3,
    planKey: "STUDIO_PRO",
    userId: USER_ID,
  };

  it("accepts an assignment without a note", () => {
    expect(ManualSubscriptionAssignmentSchema.parse(assignment)).toEqual(
      assignment,
    );
  });

  it("keys ownership by account, never by a contact detail", () => {
    expect(
      ManualSubscriptionAssignmentSchema.safeParse({
        ...assignment,
        email: "owner@example.com",
      }).success,
    ).toBe(false);
  });

  it("refuses an identifier that is not an account id", () => {
    expect(
      ManualSubscriptionAssignmentSchema.safeParse({
        ...assignment,
        userId: "owner@example.com",
      }).success,
    ).toBe(false);
  });

  it("refuses an open-ended grant", () => {
    expect(
      ManualSubscriptionAssignmentSchema.safeParse({ ...assignment, months: 0 })
        .success,
    ).toBe(false);
    expect(
      ManualSubscriptionAssignmentSchema.safeParse({
        ...assignment,
        months: 25,
      }).success,
    ).toBe(false);
  });

  it("trims a note and keeps it within the column", () => {
    expect(
      ManualSubscriptionAssignmentSchema.parse({
        ...assignment,
        note: "  Migrated from the pilot.  ",
      }).note,
    ).toBe("Migrated from the pilot.");
    expect(
      ManualSubscriptionAssignmentSchema.safeParse({
        ...assignment,
        note: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
