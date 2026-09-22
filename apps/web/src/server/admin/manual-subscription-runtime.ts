import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaManualSubscriptionRepository } from "../db/repositories/manual-subscription-repository";

let repository: PrismaManualSubscriptionRepository | undefined;

export function getManualSubscriptionRepository(): PrismaManualSubscriptionRepository {
  repository ??= new PrismaManualSubscriptionRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository;
}
