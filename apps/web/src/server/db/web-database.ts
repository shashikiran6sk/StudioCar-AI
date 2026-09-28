import { parseWebDatabaseEnvironment } from "@studiocar/config";
import { createDatabaseClient, type PrismaClient } from "@studiocar/database-runtime";

declare global {
  // Survives development module reloads and separately bundled route modules.
  var studioCarWebDatabase: PrismaClient | undefined;
}

/** One lazy client per web process, never shared across Vercel instances. */
export function getWebDatabase(): PrismaClient {
  if (globalThis.studioCarWebDatabase) return globalThis.studioCarWebDatabase;
  const environment = parseWebDatabaseEnvironment(process.env);
  globalThis.studioCarWebDatabase = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
    poolSize: environment.WEB_DATABASE_POOL_SIZE,
  });
  return globalThis.studioCarWebDatabase;
}
