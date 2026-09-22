import { describe, expect, it } from "vitest";

import {
  AUDIT_ACTIVITY_LIMIT,
  AdministrativeActionSchema,
  AuditMetadataSchema,
} from "../../../packages/contracts/src/audit";

describe("AdministrativeActionSchema", () => {
  it("names every action the administration area writes", () => {
    expect(AdministrativeActionSchema.options).toEqual([
      "INITIAL_ADMIN_BOOTSTRAPPED",
      "ADMIN_GRANTED",
      "ADMIN_REVOKED",
      "ADMIN_INVITED",
      "ADMIN_INVITATION_REVOKED",
      "PLAN_CONFIG_UPDATED",
      "SUBSCRIPTION_ASSIGNED",
      "SUBSCRIPTION_REVOKED",
      "SOCIAL_LINK_SAVED",
      "SOCIAL_LINK_REMOVED",
    ]);
  });

  it("refuses an action the trail does not describe", () => {
    expect(AdministrativeActionSchema.safeParse("VEHICLE_CREATED").success).toBe(
      false,
    );
  });
});

describe("AuditMetadataSchema", () => {
  it("accepts an entry with nothing in it", () => {
    // Every key is optional, so an older entry still renders.
    expect(AuditMetadataSchema.parse({})).toEqual({});
  });

  it("reads the fields the trail describes", () => {
    expect(
      AuditMetadataSchema.parse({ planKey: "STUDIO_PRO", months: 3 }),
    ).toMatchObject({ planKey: "STUDIO_PRO", months: 3 });
  });

  it("keeps an unrecognised key rather than failing on it", () => {
    // A newer version may have written a field this one does not know.
    expect(AuditMetadataSchema.safeParse({ somethingNew: true }).success).toBe(
      true,
    );
  });

  it("refuses a field whose type is wrong", () => {
    expect(
      AuditMetadataSchema.safeParse({ planKey: { name: "STUDIO_PRO" } })
        .success,
    ).toBe(false);
  });
});

describe("AUDIT_ACTIVITY_LIMIT", () => {
  it("bounds the overview so it cannot become an unpaged dump", () => {
    expect(AUDIT_ACTIVITY_LIMIT).toBeGreaterThan(0);
    expect(AUDIT_ACTIVITY_LIMIT).toBeLessThanOrEqual(50);
  });
});
