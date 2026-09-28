import { afterEach, expect, it, vi } from "vitest";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

vi.mock("../../../../packages/database-runtime/src/index", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../../packages/database-runtime/src/index")>();
  return { ...original, createDatabaseClient: vi.fn(original.createDatabaseClient) };
});

afterEach(async () => {
  await globalThis.studioCarWebDatabase?.$disconnect();
  globalThis.studioCarWebDatabase = undefined;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("shares the same lazy Prisma client across calls and reloaded web modules", async () => {
  vi.stubEnv("APP_ENV", "local");
  vi.stubEnv("WEB_DATABASE_POOL_SIZE", "3");
  const firstModule = await import("../../../../apps/web/src/server/db/web-database");
  const factory = await import("../../../../packages/database-runtime/src/index");
  const first = firstModule.getWebDatabase();
  expect(factory.createDatabaseClient).toHaveBeenCalledWith(expect.objectContaining({ poolSize: 3 }));
  expect(factory.createDatabaseClient).toHaveBeenCalledTimes(1);
  expect(firstModule.getWebDatabase()).toBe(first);
  vi.resetModules();
  const reloaded = await import("../../../../apps/web/src/server/db/web-database");
  expect(reloaded.getWebDatabase()).toBe(first);
  const { getSessionService } = await import("../../../../apps/web/src/server/auth/session-runtime");
  const { getAdminRoleRepository } = await import("../../../../apps/web/src/server/admin/admin-runtime");
  getSessionService();
  getAdminRoleRepository();
  expect(globalThis.studioCarWebDatabase).toBe(first);
  const reloadedFactory = await import("../../../../packages/database-runtime/src/index");
  expect(reloadedFactory.createDatabaseClient).toHaveBeenCalledTimes(1);
  const independent = createDatabaseClient({ connectionString: "postgresql://test:test@localhost/test" });
  expect(independent).not.toBe(first);
  await independent.$disconnect();
});

it("does not cache a failed configuration or allocate a client on import", async () => {
  vi.stubEnv("APP_ENV", "local");
  vi.stubEnv("WEB_DATABASE_POOL_SIZE", "0");
  const module = await import("../../../../apps/web/src/server/db/web-database");
  expect(globalThis.studioCarWebDatabase).toBeUndefined();
  expect(() => module.getWebDatabase()).toThrow();
  expect(globalThis.studioCarWebDatabase).toBeUndefined();
  vi.stubEnv("WEB_DATABASE_POOL_SIZE", "2");
  expect(module.getWebDatabase()).toBeDefined();
});
