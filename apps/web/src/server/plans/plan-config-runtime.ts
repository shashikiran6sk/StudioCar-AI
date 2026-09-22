import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaPlanConfigRepository } from "../db/repositories/plan-config-repository";

let repository: PrismaPlanConfigRepository | undefined;

export function getPlanConfigRepository(): PrismaPlanConfigRepository {
  repository ??= new PrismaPlanConfigRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository;
}
