import { describe, expect, it, vi } from "vitest";

const summarise = vi.fn();

// The runtime resolves its own connection string, so supply one rather than
// replacing the configuration package.
vi.stubEnv("APP_ENV", "local");
vi.stubEnv("DATABASE_URL", "postgresql://studiocar:secret@localhost:5432/studiocar");

vi.mock("@studiocar/database-runtime", () => ({
  createDatabaseClient: vi.fn(() => ({})),
}));
vi.mock(
  "../../../../apps/web/src/server/db/repositories/admin-overview-repository",
  () => ({ PrismaAdminOverviewRepository: class { summarise = summarise; } }),
);

const { getAdminOverview } = await import(
  "../../../../apps/web/src/server/admin/get-admin-overview"
);

describe("getAdminOverview", () => {
  it("returns bounded counts and nothing personal", async () => {
    const overview = {
      administratorCount: 2,
      userCount: 40,
      activePlanCount: 4,
      activeSubscriptionCount: 3,
      manualSubscriptionCount: 1,
      enabledSocialLinkCount: 0,
    };
    summarise.mockResolvedValue(overview);

    const result = await getAdminOverview();

    expect(result).toEqual(overview);
    expect(Object.values(result).every((value) => typeof value === "number")).toBe(
      true,
    );
  });
});
