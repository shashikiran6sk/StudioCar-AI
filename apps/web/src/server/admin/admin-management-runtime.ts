import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaAdminManagementRepository } from "../db/repositories/admin-management-repository";

let repository: PrismaAdminManagementRepository | undefined;

export function getAdminManagementRepository(): PrismaAdminManagementRepository {
  repository ??= new PrismaAdminManagementRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository;
}
