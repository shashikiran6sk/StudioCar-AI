import { describe, expect, it, vi } from "vitest";

const listRecentAdministrative = vi.fn();

vi.mock("../../../../apps/web/src/server/admin/audit-log-runtime", () => ({
  getAuditLogRepository: () => ({ listRecentAdministrative }),
}));

const { getAdminActivity } = await import(
  "../../../../apps/web/src/server/admin/get-admin-activity"
);

describe("getAdminActivity", () => {
  it("describes each change and never ships its stored metadata", async () => {
    listRecentAdministrative.mockResolvedValue([
      {
        action: "SUBSCRIPTION_ASSIGNED",
        actorName: "Ops Lead",
        createdAt: new Date("2026-09-22T10:00:00.000Z"),
        id: "0e879f46-1193-4d77-b785-057fe026d998",
        metadata: { accountUserId: "secret-account", planKey: "STUDIO_PLUS" },
        resourceId: "sub-1",
        resourceType: "PlanSubscription",
      },
    ]);

    const entries = await getAdminActivity();

    expect(entries).toEqual([
      {
        actorLabel: "Ops Lead",
        id: "0e879f46-1193-4d77-b785-057fe026d998",
        occurredAt: "2026-09-22T10:00:00.000Z",
        summary: "Assigned a plan (STUDIO_PLUS).",
      },
    ]);
    // The account the subscription belongs to never leaves the server.
    expect(JSON.stringify(entries)).not.toContain("secret-account");
  });

  it("asks for a bounded number of entries", async () => {
    listRecentAdministrative.mockResolvedValue([]);

    await getAdminActivity();

    const [limit] = listRecentAdministrative.mock.calls.at(-1) ?? [];
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(50);
  });
  it("distinguishes a removed administrator from StudioCar AI itself", async () => {
    listRecentAdministrative.mockResolvedValue([
      {
        action: "PLAN_CONFIG_UPDATED",
        actorName: null,
        createdAt: new Date("2026-09-22T10:00:00.000Z"),
        id: "1e879f46-1193-4d77-b785-057fe026d998",
        metadata: {},
        resourceId: "STUDIO_PRO",
        resourceType: "PlanConfig",
      },
      {
        action: "INITIAL_ADMIN_BOOTSTRAPPED",
        actorName: null,
        createdAt: new Date("2026-09-20T10:00:00.000Z"),
        id: "2e879f46-1193-4d77-b785-057fe026d998",
        metadata: {},
        resourceId: "2b8f0ad2-1c37-4a0d-9b93-9b0e1a1f2c34",
        resourceType: "UserRole",
      },
    ]);

    const entries = await getAdminActivity();

    // Deleting an administrator nulls the actor; that is not the system acting.
    expect(entries.map((entry) => entry.actorLabel)).toEqual([
      "A removed account",
      "StudioCar AI",
    ]);
  });
});
