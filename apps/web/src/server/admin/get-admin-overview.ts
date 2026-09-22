import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { cache } from "react";

import type { AdminOverview } from "./admin-overview.types";
import { PrismaAdminOverviewRepository } from "../db/repositories/admin-overview-repository";

let repository: PrismaAdminOverviewRepository | undefined;

/**
 * Bounded counts only. The overview is a summary, not a place to read anybody's
 * personal data.
 */
export const getAdminOverview = cache((): Promise<AdminOverview> => {
  repository ??= new PrismaAdminOverviewRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository.summarise();
});
