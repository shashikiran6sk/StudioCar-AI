import { describe, expect, it } from "vitest";

import { describeAuditEntry } from "../../../../apps/web/src/server/admin/describe-audit-entry";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    action: "ADMIN_GRANTED",
    actorName: "Ops Lead",
    createdAt: new Date("2026-09-22T10:00:00.000Z"),
    id: "0e879f46-1193-4d77-b785-057fe026d998",
    metadata: { email: "owner@example.com" },
    resourceId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
    resourceType: "UserRole",
    ...overrides,
  };
}

describe("describeAuditEntry", () => {
  it("names who was granted access", () => {
    expect(describeAuditEntry(entry())).toBe(
      "Granted administrator access (owner@example.com).",
    );
  });

  it("names the plan that was assigned", () => {
    expect(
      describeAuditEntry(
        entry({
          action: "SUBSCRIPTION_ASSIGNED",
          metadata: { planKey: "STUDIO_PLUS", months: 3 },
        }),
      ),
    ).toBe("Assigned a plan (STUDIO_PLUS).");
  });

  it("describes a manual credit grant", () => {
    expect(describeAuditEntry(entry({ action: "ADMIN_CREDIT_GRANTED", metadata: { accountUserId: "customer-1" } }))).toBe("Granted Studio Plus credits (customer-1).");
  });

  it("names the plan that was edited", () => {
    expect(
      describeAuditEntry(
        entry({
          action: "PLAN_CONFIG_UPDATED",
          metadata: { priceMinorUnits: 799_900 },
          resourceId: "STUDIO_PRO",
        }),
      ),
    ).toBe("Updated a plan (STUDIO_PRO).");
  });

  it("names the platform whose footer link changed", () => {
    expect(
      describeAuditEntry(
        entry({
          action: "SOCIAL_LINK_SAVED",
          metadata: { url: "https://instagram.com/studiocar" },
          resourceId: "INSTAGRAM",
        }),
      ),
    ).toBe("Saved a footer link (INSTAGRAM).");
  });

  it("describes the first administrator without inventing a detail", () => {
    expect(
      describeAuditEntry(
        entry({
          action: "INITIAL_ADMIN_BOOTSTRAPPED",
          actorName: null,
          metadata: { source: "BOOTSTRAP" },
        }),
      ),
    ).toBe("Granted the first administrator.");
  });

  it("omits a detail an older entry does not carry", () => {
    expect(describeAuditEntry(entry({ metadata: null }))).toBe(
      "Granted administrator access.",
    );
  });

  it("omits a detail whose stored type is wrong rather than printing it", () => {
    // Metadata is Json, so nothing guarantees what is in it.
    expect(describeAuditEntry(entry({ metadata: { email: 42 } }))).toBe(
      "Granted administrator access.",
    );
  });

  it("survives metadata that is not an object at all", () => {
    expect(describeAuditEntry(entry({ metadata: "corrupted" }))).toBe(
      "Granted administrator access.",
    );
  });

  it("reports an action it does not know rather than hiding it", () => {
    expect(
      describeAuditEntry(
        entry({
          action: "SOMETHING_NEW",
          resourceId: "abc",
          resourceType: "Widget",
        }),
      ),
    ).toBe("SOMETHING_NEW on Widget (abc).");
  });
});
