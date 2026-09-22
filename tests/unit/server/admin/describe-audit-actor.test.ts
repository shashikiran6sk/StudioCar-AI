import { describe, expect, it } from "vitest";

import { describeAuditActor } from "../../../../apps/web/src/server/admin/describe-audit-actor";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    action: "PLAN_CONFIG_UPDATED",
    actorName: null,
    createdAt: new Date("2026-09-22T10:00:00.000Z"),
    id: "0e879f46-1193-4d77-b785-057fe026d998",
    metadata: {},
    resourceId: "STUDIO_PRO",
    resourceType: "PlanConfig",
    ...overrides,
  };
}

describe("describeAuditActor", () => {
  it("names the administrator who made the change", () => {
    expect(describeAuditActor(entry({ actorName: "Ops Lead" }))).toBe(
      "Ops Lead",
    );
  });

  it("names StudioCar AI only for what it actually does itself", () => {
    expect(
      describeAuditActor(entry({ action: "INITIAL_ADMIN_BOOTSTRAPPED" })),
    ).toBe("StudioCar AI");
  });

  it("reports a deleted administrator as a removed account", () => {
    // `AuditLog.userId` is set to null when an administrator is deleted, and
    // reporting that as StudioCar AI acting would be untrue.
    expect(describeAuditActor(entry())).toBe("A removed account");
    expect(describeAuditActor(entry({ action: "SUBSCRIPTION_ASSIGNED" }))).toBe(
      "A removed account",
    );
  });
});
